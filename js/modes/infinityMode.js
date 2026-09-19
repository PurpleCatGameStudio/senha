import { CONFIG } from "../config.js";
import { readJSON, writeJSON } from "../storage.js";
import { pickRandomWord } from "../wordBank.js";

export class InfinityMode {
    constructor({ wordList, engine, ui }) {
        this.wordList = wordList;
        this.engine = engine;
        this.ui = ui;
        this.attemptPool = CONFIG.maxAttempts;
        this.streak = 0;
        this.usedWords = new Set();
    }

    getRecord() {
        const saved = readJSON(CONFIG.storageKeys.infinityRecord);
        return saved?.best ?? 0;
    }

    setRecord(value) {
        writeJSON(CONFIG.storageKeys.infinityRecord, { best: value });
    }

    start() {
        this.streak = 0;
        this.usedWords = new Set();

        this.ui.hideResult();
        this.ui.showMessage("");
        this.ui.updateStreak(this.streak);
        this.ui.updateRecord(this.getRecord());

        this.nextWord();
    }

    restart() {
        this.start();
    }

    stop() {}

    nextWord() {
        const target = pickRandomWord(this.wordList, this.usedWords);
        this.usedWords.add(target);
        this.engine.startWord(target);
    }

    onWrongGuess() {
        const remaining = this.attemptPool - this.engine.guesses.length;
        this.ui.showMessage(`Tentativas restantes: ${Math.max(0, remaining)}`);
    }

    onWordSolved() {
        this.streak += 1;
        this.ui.updateStreak(this.streak);
        this.nextWord();
    }

    onWordFailed() {
        const record = this.getRecord();
        const isNewRecord = this.streak > record;

        if (isNewRecord) {
            this.setRecord(this.streak);
        }

        this.ui.showResult({
            title: "Sequência encerrada",
            answer: this.engine.target,
            message: `Você acertou ${this.streak} palavra${this.streak === 1 ? "" : "s"} seguidas.`,
            extraLine: isNewRecord ? "Novo recorde pessoal!" : `Recorde pessoal: ${Math.max(record, this.streak)}`,
            showCountdown: false
        });
    }
}