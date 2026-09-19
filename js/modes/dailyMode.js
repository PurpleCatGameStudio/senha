import { CONFIG } from "../config.js";
import { readJSON, writeJSON, removeKey } from "../storage.js";
import { getDayIndex, getDailyWord } from "../wordBank.js";
import { evaluateGuess } from "../evaluation.js";
import { computeDailySignature, verifyDailySignature } from "../integrity.js";

export class DailyMode {
    constructor({ wordList, engine, ui }) {
        this.wordList = wordList;
        this.engine = engine;
        this.ui = ui;
    }

    persist(gameOver) {
        const day = getDayIndex(CONFIG.epoch).toString();
        const target = this.engine.target;
        const guesses = this.engine.guesses;

        writeJSON(CONFIG.storageKeys.daily, {
            day,
            target,
            guesses,
            gameOver,
            signature: computeDailySignature({ day, target, guesses, gameOver })
        });
    }

    start() {
        this.ui.hideResult();
        this.ui.showMessage("");

        const todayKey = getDayIndex(CONFIG.epoch).toString();
        const saved = readJSON(CONFIG.storageKeys.daily);

        if (saved && saved.day === todayKey && typeof saved.target === "string") {
            if (!verifyDailySignature(saved)) {
                this.ui.showTamperAlert();
            }

            const target = saved.target;
            const guesses = Array.isArray(saved.guesses) ? saved.guesses : [];
            const evaluations = guesses.map(guess => evaluateGuess(guess, target, CONFIG.wordLength));
            const gameOver = Boolean(saved.gameOver);

            this.engine.startWord(target, { guesses, evaluations });
            this.persist(gameOver);

            if (gameOver) {
                this.engine.stop();
                this.finish(guesses.includes(target));
            }

            return;
        }

        this.startFreshWord();
    }

    startFreshWord() {
        const target = getDailyWord(this.wordList, CONFIG.epoch);

        this.engine.startWord(target);
        this.persist(false);
    }

    onWrongGuess() {
        this.persist(false);
    }

    onWordSolved() {
        this.persist(true);
        this.finish(true);
    }

    onWordFailed() {
        this.persist(true);
        this.finish(false);
    }

    finish(won) {
        this.ui.showResult({
            title: won ? "Você acertou!" : "Fim de jogo",
            answer: this.engine.target,
            message: won ? "Você acertou!" : `A palavra era ${this.engine.target}.`,
            extraLine: null,
            showCountdown: true
        });
    }

    devResetAttempts() {
        const target = this.engine.target;

        removeKey(CONFIG.storageKeys.daily);
        this.engine.startWord(target);
        this.persist(false);
        this.ui.hideResult();
        this.ui.showMessage("");
    }

    restart() {
        removeKey(CONFIG.storageKeys.daily);
        this.startFreshWord();
        this.ui.hideResult();
        this.ui.showMessage("");
    }
}