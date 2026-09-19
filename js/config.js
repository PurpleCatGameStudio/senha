export const CONFIG = Object.freeze({
    wordLength: 5,
    maxAttempts: 6,
    epoch: new Date(2026, 0, 1).getTime(),
    wordListPath: "./data/words.txt",
    lexiconPath: "./data/lexicon.txt",
    battleRoyaleDurationSeconds: 600,
    storageKeys: Object.freeze({
        daily: "senha-daily-state",
        battleRoyaleRecord: "senha-br-record",
        infinityRecord: "senha-infinity-record"
    })
});

export const KEYBOARD_ROWS = Object.freeze([
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ç"],
    ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"]
]);
