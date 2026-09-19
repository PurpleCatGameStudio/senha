import { CONFIG } from "../config.js";
import { readJSON, writeJSON, removeKey } from "../storage.js";
import { getDayIndex, getDailyWord, getNextDistinctWord } from "../wordBank.js";
import { evaluateGuess } from "../evaluation.js";

export class DailyMode {
    constructor({ wordList, engine, ui }) {
        this.wordList = wordList;
        this.engine = engine;
        this.ui = ui;
    }

    persist(gameOver) {
        writeJSON(CONFIG.storageKeys.daily, {
            day: getDayIndex(CONFIG.epoch).toString(),
            target: this.engine.target,
            guesses: this.engine.guesses,
            gameOver
        });
    }

    start() {
        this.ui.hideResult();
        this.ui.showMessage("");

        const todayKey = getDayIndex(CONFIG.epoch).toString();
        const saved = readJSON(CONFIG.storageKeys.daily);

        if (saved && saved.day === todayKey && typeof saved.target === "string") {
            const target = saved.target;
            const guesses = Array.isArray(saved.guesses) ? saved.guesses : [];
            const evaluations = guesses.map(guess => evaluateGuess(guess, target, CONFIG.wordLength));

            this.engine.startWord(target, { guesses, evaluations });

            if (Boolean(saved.gameOver)) {
                this.engine.stop();
                this.finish(guesses.includes(target));
            }

            return;
        }

        const target = getDailyWord(this.wordList, CONFIG.epoch);

        this.engine.startWord(target);
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

    devSkipWord() {
        const nextWord = getNextDistinctWord(this.wordList, this.engine.target);

        removeKey(CONFIG.storageKeys.daily);
        this.engine.startWord(nextWord);
        this.persist(false);
        this.ui.hideResult();
        this.ui.showMessage("");
    }

    restart() {
        removeKey(CONFIG.storageKeys.daily);

        const target = getDailyWord(this.wordList, CONFIG.epoch);

        this.engine.startWord(target);
        this.persist(false);
        this.ui.hideResult();
        this.ui.showMessage("");
    }
}
