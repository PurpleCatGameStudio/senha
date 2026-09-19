import { CONFIG } from "../config.js";
import { readJSON, writeJSON } from "../storage.js";
import { pickRandomWord } from "../wordBank.js";

export class BattleRoyaleMode {
    constructor({ wordList, engine, ui, durationSeconds = CONFIG.battleRoyaleDurationSeconds }) {
        this.wordList = wordList;
        this.engine = engine;
        this.ui = ui;
        this.durationSeconds = durationSeconds;
        this.secondsRemaining = durationSeconds;
        this.solvedCount = 0;
        this.timerId = null;
        this.finished = false;
    }

    getRecord() {
        const saved = readJSON(CONFIG.storageKeys.battleRoyaleRecord);
        return saved?.best ?? 0;
    }

    setRecord(value) {
        writeJSON(CONFIG.storageKeys.battleRoyaleRecord, { best: value });
    }

    start() {
        this.stop();

        this.secondsRemaining = this.durationSeconds;
        this.solvedCount = 0;
        this.finished = false;

        this.ui.hideResult();
        this.ui.showMessage("");
        this.ui.updateScore(this.solvedCount);
        this.ui.updateTimer(this.secondsRemaining);
        this.ui.updateRecord(this.getRecord());

        this.nextWord();

        this.timerId = setInterval(() => this.tick(), 1000);
    }

    restart() {
        this.start();
    }

    stop() {
        if (this.timerId !== null) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
    }

    nextWord() {
        const target = pickRandomWord(this.wordList, this.engine.target || null);
        this.engine.startWord(target);
    }

    tick() {
        if (this.finished) {
            return;
        }

        this.secondsRemaining -= 1;
        this.ui.updateTimer(this.secondsRemaining);

        if (this.secondsRemaining <= 0) {
            this.finishGame();
        }
    }

    onWordSolved() {
        this.solvedCount += 1;
        this.ui.updateScore(this.solvedCount);

        if (!this.finished) {
            this.nextWord();
        }
    }

    onWordFailed() {
        if (!this.finished) {
            this.nextWord();
        }
    }

    finishGame() {
        if (this.finished) {
            return;
        }

        this.finished = true;
        this.stop();
        this.engine.stop();

        const record = this.getRecord();
        const isNewRecord = this.solvedCount > record;

        if (isNewRecord) {
            this.setRecord(this.solvedCount);
        }

        this.ui.showResult({
            title: "Tempo esgotado!",
            answer: this.engine.target,
            message: `Você acertou ${this.solvedCount} palavra${this.solvedCount === 1 ? "" : "s"}.`,
            extraLine: isNewRecord ? "Novo recorde pessoal!" : `Recorde pessoal: ${Math.max(record, this.solvedCount)}`,
            showCountdown: false
        });
    }
}
