const CONFIG = Object.freeze({
    wordLength: 5,
    maxAttempts: 6,
    storageKey: "senha-game-state",
    epoch: Date.UTC(2026, 0, 1),
    wordListPath: "./data/words.txt"
});

const KEYBOARD_ROWS = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ç"],
    ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"]
];

const gameState = {
    target: "",
    guesses: [],
    currentGuess: "",
    gameOver: false,
    evaluations: []
};

let WORDS = [];

const boardElement = document.getElementById("board");
const keyboardElement = document.getElementById("keyboard");
const messageElement = document.getElementById("message");
const statsElement = document.getElementById("stats");
const resultTitleElement = document.getElementById("resultTitle");
const answerElement = document.getElementById("answer");
const countdownElement = document.getElementById("countdown");
const helpModalElement = document.getElementById("helpModal");
const helpButtonElement = document.getElementById("helpButton");
const closeHelpButtonElement = document.getElementById("closeHelpButton");

function normalizeWord(value) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .replace(/[^A-Z]/g, "");
}

async function loadWords() {
    try {
        const response = await fetch(CONFIG.wordListPath, {
            cache: "default"
        });

        if (!response.ok) {
            throw new Error(`Word list request failed: ${response.status}`);
        }

        const text = await response.text();

        WORDS = [...new Set(
            text
                .split(/\r?\n/)
                .map(word => normalizeWord(word.trim()))
                .filter(word => word.length === CONFIG.wordLength)
        )];

        if (WORDS.length === 0) {
            throw new Error("Word list contains no valid five-letter words.");
        }
    } catch (error) {
        console.error("Failed to load word list:", error);
        showMessage("Não foi possível carregar a lista de palavras.");
        throw error;
    }
}

function getDayIndex() {
    const now = new Date();
    const utcToday = Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate()
    );

    return Math.floor((utcToday - CONFIG.epoch) / 86400000);
}

function getDailyWord() {
    const index = Math.abs(getDayIndex()) % WORDS.length;
    return WORDS[index];
}

function loadState() {
    const todayKey = getDayIndex().toString();

    try {
        const saved = JSON.parse(localStorage.getItem(CONFIG.storageKey));

        if (!saved || saved.day !== todayKey) {
            gameState.target = getDailyWord();
            gameState.guesses = [];
            gameState.currentGuess = "";
            gameState.gameOver = false;
            gameState.evaluations = [];
            return;
        }

        gameState.target = saved.target;
        gameState.guesses = Array.isArray(saved.guesses) ? saved.guesses : [];
        gameState.currentGuess = "";
        gameState.gameOver = Boolean(saved.gameOver);
        gameState.evaluations = gameState.guesses.map(evaluateGuess);
    } catch {
        gameState.target = getDailyWord();
        gameState.guesses = [];
        gameState.currentGuess = "";
        gameState.gameOver = false;
        gameState.evaluations = [];
    }
}

function saveState() {
    const data = {
        day: getDayIndex().toString(),
        target: gameState.target,
        guesses: gameState.guesses,
        gameOver: gameState.gameOver
    };

    localStorage.setItem(CONFIG.storageKey, JSON.stringify(data));
}

function createBoard() {
    boardElement.innerHTML = "";

    for (let row = 0; row < CONFIG.maxAttempts; row++) {
        for (let column = 0; column < CONFIG.wordLength; column++) {
            const tile = document.createElement("div");

            tile.className = "tile";
            tile.dataset.row = row;
            tile.dataset.column = column;

            boardElement.appendChild(tile);
        }
    }
}

function createKeyboard() {
    keyboardElement.innerHTML = "";

    KEYBOARD_ROWS.forEach(row => {
        const rowElement = document.createElement("div");

        rowElement.className = "keyboard-row";

        row.forEach(key => {
            const button = document.createElement("button");

            button.type = "button";
            button.className = "key";
            button.textContent = key === "BACKSPACE" ? "⌫" : key;
            button.dataset.key = key;

            if (key === "ENTER" || key === "BACKSPACE") {
                button.classList.add("wide");
            }

            button.addEventListener("click", () => handleKey(key));

            rowElement.appendChild(button);
        });

        keyboardElement.appendChild(rowElement);
    });
}

function evaluateGuess(guess) {
    const result = Array(CONFIG.wordLength).fill("absent");
    const remaining = gameState.target.split("");

    for (let index = 0; index < CONFIG.wordLength; index++) {
        if (guess[index] === gameState.target[index]) {
            result[index] = "correct";
            remaining[index] = null;
        }
    }

    for (let index = 0; index < CONFIG.wordLength; index++) {
        if (result[index] !== "absent") {
            continue;
        }

        const remainingIndex = remaining.indexOf(guess[index]);

        if (remainingIndex !== -1) {
            result[index] = "present";
            remaining[remainingIndex] = null;
        }
    }

    return result;
}

function renderBoard() {
    const tiles = [...boardElement.children];

    tiles.forEach(tile => {
        tile.textContent = "";
        tile.className = "tile";
    });

    gameState.guesses.forEach((guess, row) => {
        const evaluation = gameState.evaluations[row];

        [...guess].forEach((letter, column) => {
            const tile = tiles[row * CONFIG.wordLength + column];

            if (!tile) {
                return;
            }

            tile.textContent = letter;
            tile.classList.add("filled", evaluation[column]);
        });
    });

    [...gameState.currentGuess].forEach((letter, column) => {
        const row = gameState.guesses.length;
        const tile = tiles[row * CONFIG.wordLength + column];

        if (!tile) {
            return;
        }

        tile.textContent = letter;
        tile.classList.add("filled");
    });
}

function getKeyboardPriority(status) {
    return {
        absent: 1,
        present: 2,
        correct: 3
    }[status] ?? 0;
}

function updateKeyboard() {
    const statuses = new Map();

    gameState.guesses.forEach((guess, row) => {
        [...guess].forEach((letter, column) => {
            const status = gameState.evaluations[row][column];
            const current = statuses.get(letter);

            if (getKeyboardPriority(status) > getKeyboardPriority(current)) {
                statuses.set(letter, status);
            }
        });
    });

    document.querySelectorAll(".key").forEach(button => {
        const key = button.dataset.key;

        button.classList.remove("correct", "present", "absent");

        if (statuses.has(key)) {
            button.classList.add(statuses.get(key));
        }
    });
}

function showMessage(message) {
    messageElement.textContent = message;
}

function submitGuess() {
    if (gameState.currentGuess.length !== CONFIG.wordLength) {
        showMessage("A palavra precisa ter 5 letras.");
        return;
    }

    if (!WORDS.includes(gameState.currentGuess)) {
        showMessage("Essa palavra não está na lista.");
        return;
    }

    gameState.guesses.push(gameState.currentGuess);
    gameState.evaluations.push(evaluateGuess(gameState.currentGuess));

    const correct = gameState.currentGuess === gameState.target;

    gameState.currentGuess = "";

    if (correct || gameState.guesses.length >= CONFIG.maxAttempts) {
        gameState.gameOver = true;
    }

    saveState();
    renderBoard();
    updateKeyboard();

    if (correct) {
        showMessage("Você acertou!");
        showStats(true);
        return;
    }

    if (gameState.gameOver) {
        showMessage(`A palavra era ${gameState.target}.`);
        showStats(false);
        return;
    }

    showMessage("");
}

function handleKey(key) {
    if (gameState.gameOver) {
        return;
    }

    if (key === "ENTER") {
        submitGuess();
        return;
    }

    if (key === "BACKSPACE") {
        gameState.currentGuess = gameState.currentGuess.slice(0, -1);
        renderBoard();
        return;
    }

    const letter = normalizeWord(key);

    if (!letter || gameState.currentGuess.length >= CONFIG.wordLength) {
        return;
    }

    gameState.currentGuess += letter;
    renderBoard();
}

function handlePhysicalKeyboard(event) {
    if (event.ctrlKey || event.altKey || event.metaKey) {
        return;
    }

    if (event.key === "Enter") {
        handleKey("ENTER");
        return;
    }

    if (event.key === "Backspace" || event.key === "Delete") {
        handleKey("BACKSPACE");
        return;
    }

    const letter = normalizeWord(event.key);

    if (letter.length === 1) {
        handleKey(letter);
    }
}

function showStats(won) {
    statsElement.classList.remove("hidden");
    resultTitleElement.textContent = won ? "Você venceu!" : "Fim de jogo";
    answerElement.textContent = gameState.target;
}

function updateCountdown() {
    if (!gameState.gameOver) {
        statsElement.classList.add("hidden");
        return;
    }

    const now = new Date();
    const nextDay = new Date(now);

    nextDay.setHours(24, 0, 0, 0);

    const difference = Math.max(
        0,
        nextDay.getTime() - now.getTime()
    );

    const totalSeconds = Math.floor(difference / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    countdownElement.textContent = [
        hours.toString().padStart(2, "0"),
        minutes.toString().padStart(2, "0"),
        seconds.toString().padStart(2, "0")
    ].join(":");
}

function openHelp() {
    helpModalElement.classList.remove("hidden");
}

function closeHelp() {
    helpModalElement.classList.add("hidden");
}

async function initialize() {
    if (
        !boardElement ||
        !keyboardElement ||
        !messageElement ||
        !statsElement ||
        !resultTitleElement ||
        !answerElement ||
        !countdownElement ||
        !helpModalElement ||
        !helpButtonElement ||
        !closeHelpButtonElement
    ) {
        console.error("Required HTML elements were not found.");
        return;
    }

    try {
        await loadWords();
    } catch {
        return;
    }

    loadState();
    createBoard();
    createKeyboard();
    renderBoard();
    updateKeyboard();

    if (gameState.gameOver) {
        const won = gameState.guesses.includes(gameState.target);

        showStats(won);
        showMessage(
            won
                ? "Você acertou!"
                : `A palavra era ${gameState.target}.`
        );
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
}

document.addEventListener("keydown", handlePhysicalKeyboard);

helpButtonElement.addEventListener("click", openHelp);

closeHelpButtonElement.addEventListener("click", closeHelp);

helpModalElement.addEventListener("click", event => {
    if (event.target === helpModalElement) {
        closeHelp();
    }
});

initialize();