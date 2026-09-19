export function normalizeWord(value) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .replace(/[^A-Z]/g, "");
}

export async function loadWordList(path, wordLength) {
    const response = await fetch(path, { cache: "default" });

    if (!response.ok) {
        throw new Error(`Word list request failed: ${response.status}`);
    }

    const text = await response.text();

    const words = [...new Set(
        text
            .split(/\r?\n/)
            .map(word => normalizeWord(word.trim()))
            .filter(word => word.length === wordLength)
    )];

    if (words.length === 0) {
        throw new Error("Word list contains no valid words.");
    }

    return words;
}

export function pickRandomWord(words, excludeWord = null) {
    if (words.length === 1) {
        return words[0];
    }

    let candidate = words[Math.floor(Math.random() * words.length)];

    while (candidate === excludeWord) {
        candidate = words[Math.floor(Math.random() * words.length)];
    }

    return candidate;
}

export function getDayIndex(epoch) {
    const now = new Date();
    const localToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
    );

    return Math.floor((localToday.getTime() - epoch) / 86400000);
}

export function getDailyWord(words, epoch, dayOffset = 0) {
    const today = getDayIndex(epoch) + dayOffset;
    let index = Math.abs(today) % words.length;
    const previousIndex = Math.abs(today - 1) % words.length;
    const previousWord = words[previousIndex];

    for (let attempts = 0; attempts < words.length; attempts++) {
        const word = words[index];

        if (word !== previousWord && word[0] !== previousWord[0]) {
            return word;
        }

        index = (index + 1) % words.length;
    }

    return words[Math.abs(today) % words.length];
}
