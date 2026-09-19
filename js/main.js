import { CONFIG, KEYBOARD_ROWS } from "./config.js";
import { loadWordList, getDayIndex } from "./wordBank.js";
import { readJSON } from "./storage.js";
import { BoardView } from "./boardUI.js";
import { KeyboardView } from "./keyboardUI.js";
import { GameEngine } from "./gameEngine.js";
import { UIController } from "./uiController.js";
import { DailyMode } from "./modes/dailyMode.js";
import { BattleRoyaleMode } from "./modes/battleRoyaleMode.js";
import { InfinityMode } from "./modes/infinityMode.js";

const refs = {
    modeSelectScreen: document.getElementById("modeSelectScreen"),
    gameScreen: document.getElementById("gameScreen"),
    dailyModeStatus: document.getElementById("dailyModeStatus"),
    battleRoyaleModeStatus: document.getElementById("battleRoyaleModeStatus"),
    infinityModeStatus: document.getElementById("infinityModeStatus"),
    selectDailyMode: document.getElementById("selectDailyMode"),
    selectBattleRoyaleMode: document.getElementById("selectBattleRoyaleMode"),
    selectInfinityMode: document.getElementById("selectInfinityMode"),
    backToModesButton: document.getElementById("backToModesButton"),
    backToModesFromStats: document.getElementById("backToModesFromStats"),
    modeTitle: document.getElementById("modeTitle"),
    board: document.getElementById("board"),
    keyboard: document.getElementById("keyboard"),
    message: document.getElementById("message"),
    statsElement: document.getElementById("stats"),
    resultTitleElement: document.getElementById("resultTitle"),
    answerElement: document.getElementById("answer"),
    extraLineElement: document.getElementById("extraLine"),
    countdownWrapperElement: document.getElementById("countdownWrapper"),
    countdownElement: document.getElementById("countdown"),
    resetButton: document.getElementById("resetButton"),
    devResetButton: document.getElementById("devResetButton"),
    helpModal: document.getElementById("helpModal"),
    helpButton: document.getElementById("helpButton"),
    closeHelpButton: document.getElementById("closeHelpButton"),
    timerMetaItem: document.getElementById("timerMetaItem"),
    scoreMetaItem: document.getElementById("scoreMetaItem"),
    streakMetaItem: document.getElementById("streakMetaItem"),
    recordMetaItem: document.getElementById("recordMetaItem"),
    timerValue: document.getElementById("timerValue"),
    scoreValue: document.getElementById("scoreValue"),
    streakValue: document.getElementById("streakValue"),
    recordValue: document.getElementById("recordValue")
};

const requiredRefs = Object.values(refs);

if (requiredRefs.some(ref => !ref)) {
    console.error("Required HTML elements were not found.");
    throw new Error("Missing DOM elements.");
}

const ui = new UIController(refs);

let wordList = [];
let wordSet = new Set();
let boardView = null;
let keyboardView = null;
let engine = null;
let activeMode = null;

function handleKey(key) {
    engine?.handleKey(key);
}

function handlePhysicalKeyboard(event) {
    if (event.ctrlKey || event.altKey || event.metaKey) {
        return;
    }

    if (refs.gameScreen.classList.contains("hidden")) {
        return;
    }

    if (!refs.helpModal.classList.contains("hidden")) {
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

    handleKey(event.key);
}

function refreshModeSelectStats() {
    const todayKey = getDayIndex(CONFIG.epoch).toString();
    const dailySaved = readJSON(CONFIG.storageKeys.daily);
    const playedToday = Boolean(dailySaved && dailySaved.day === todayKey && dailySaved.gameOver);

    refs.dailyModeStatus.textContent = playedToday ? "Jogado hoje ✓" : "Disponível hoje";

    const battleRoyaleRecord = readJSON(CONFIG.storageKeys.battleRoyaleRecord);
    refs.battleRoyaleModeStatus.textContent = `Recorde: ${battleRoyaleRecord?.best ?? 0} palavras`;

    const infinityRecord = readJSON(CONFIG.storageKeys.infinityRecord);
    refs.infinityModeStatus.textContent = `Recorde: sequência de ${infinityRecord?.best ?? 0}`;
}

function updateCountdown() {
    const now = new Date();
    const nextDay = new Date(now);

    nextDay.setHours(24, 0, 0, 0);

    const difference = Math.max(0, nextDay.getTime() - now.getTime());
    const totalSeconds = Math.floor(difference / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    ui.updateCountdown([
        hours.toString().padStart(2, "0"),
        minutes.toString().padStart(2, "0"),
        seconds.toString().padStart(2, "0")
    ].join(":"));
}

function createEngine() {
    return new GameEngine({
        boardView,
        keyboardView,
        wordSet,
        messageElement: refs.message,
        wordLength: CONFIG.wordLength,
        maxAttempts: CONFIG.maxAttempts
    });
}

function startMode(modeId) {
    refs.modeSelectScreen.classList.add("hidden");
    refs.gameScreen.classList.remove("hidden");
    ui.hideResult();
    ui.showMessage("");

    engine = createEngine();

    if (modeId === "daily") {
        ui.setModeTitle("SENHA · Diário");
        ui.configureMeta({ showDevReset: true });
        activeMode = new DailyMode({ wordList, engine, ui });
    } else if (modeId === "battle-royale") {
        ui.setModeTitle("SENHA · Battle Royale");
        ui.configureMeta({ showTimer: true, showScore: true, showRecord: true });
        activeMode = new BattleRoyaleMode({ wordList, engine, ui });
    } else if (modeId === "infinity") {
        ui.setModeTitle("SENHA · Infinity");
        ui.configureMeta({ showStreak: true, showRecord: true });
        activeMode = new InfinityMode({ wordList, engine, ui });
    } else {
        throw new Error(`Unknown mode: ${modeId}`);
    }

    engine.setMode(activeMode);
    activeMode.start();
}

function returnToModeSelect() {
    activeMode?.stop?.();
    activeMode = null;
    engine = null;

    refs.gameScreen.classList.add("hidden");
    refs.modeSelectScreen.classList.remove("hidden");

    refreshModeSelectStats();
}

function openHelp() {
    refs.helpModal.classList.remove("hidden");
}

function closeHelp() {
    refs.helpModal.classList.add("hidden");
}

async function initialize() {
    try {
        wordList = await loadWordList(CONFIG.wordListPath, CONFIG.wordLength);
        wordSet = new Set(wordList);
    } catch (error) {
        console.error("Failed to load word list:", error);
        refs.dailyModeStatus.textContent = "Erro ao carregar palavras.";
        refs.battleRoyaleModeStatus.textContent = "Indisponível";
        refs.infinityModeStatus.textContent = "Indisponível";
        return;
    }

    boardView = new BoardView(refs.board, CONFIG.wordLength, CONFIG.maxAttempts);
    keyboardView = new KeyboardView(refs.keyboard, KEYBOARD_ROWS, handleKey);

    refreshModeSelectStats();

    refs.selectDailyMode.addEventListener("click", () => startMode("daily"));
    refs.selectBattleRoyaleMode.addEventListener("click", () => startMode("battle-royale"));
    refs.selectInfinityMode.addEventListener("click", () => startMode("infinity"));

    refs.backToModesButton.addEventListener("click", returnToModeSelect);
    refs.backToModesFromStats.addEventListener("click", returnToModeSelect);

    refs.resetButton.addEventListener("click", () => activeMode?.restart());
    refs.devResetButton.addEventListener("click", () => {
        if (activeMode instanceof DailyMode) {
            activeMode.devSkipWord();
        }
    });

    refs.helpButton.addEventListener("click", openHelp);
    refs.closeHelpButton.addEventListener("click", closeHelp);
    refs.helpModal.addEventListener("click", event => {
        if (event.target === refs.helpModal) {
            closeHelp();
        }
    });

    document.addEventListener("keydown", handlePhysicalKeyboard);

    updateCountdown();
    setInterval(updateCountdown, 1000);
}

initialize();
