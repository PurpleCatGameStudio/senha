import { evaluateGuess } from "./evaluation.js";
import { normalizeWord } from "./wordBank.js";

export class GameEngine {
    constructor({ boardView, keyboardView, wordSet, messageElement, wordLength, maxAttempts }) {
        this.boardView = boardView;
        this.keyboardView = keyboardView;
        this.wordSet = wordSet;
        this.messageElement = messageElement;
        this.wordLength = wordLength;
        this.maxAttempts = maxAttempts;
        this.mode = null;

        this.target = "";
        this.guesses = [];
        this.evaluations = [];
        this.currentGuess = "";
        this.acceptingInput = false;
    }

    setMode(mode) {
        this.mode = mode;
    }

    showMessage(text) {
        this.messageElement.textContent = text;
    }

    startWord(target, { guesses = [], evaluations = [] } = {}) {
        this.target = target;
        this.guesses = [...guesses];
        this.evaluations = [...evaluations];
        this.currentGuess = "";
        this.acceptingInput = true;

        this.boardView.clearBoard();
        this.keyboardView.reset();

        this.guesses.forEach((guess, row) => {
            this.boardView.revealRow(row, guess, this.evaluations[row]);
        });

        this.keyboardView.update(this.guesses, this.evaluations);
        this.boardView.renderCurrentRow(this.guesses.length, this.currentGuess);
    }

    handleKey(key) {
        if (!this.acceptingInput) {
            return;
        }

        if (key === "ENTER") {
            this.submitGuess();
            return;
        }

        if (key === "BACKSPACE") {
            this.currentGuess = this.currentGuess.slice(0, -1);
            this.boardView.renderCurrentRow(this.guesses.length, this.currentGuess);
            return;
        }

        const letter = normalizeWord(key);

        if (!letter || this.currentGuess.length >= this.wordLength) {
            return;
        }

        this.currentGuess += letter;
        this.boardView.renderCurrentRow(this.guesses.length, this.currentGuess);
    }

    submitGuess() {
        const rowIndex = this.guesses.length;

        if (this.currentGuess.length !== this.wordLength) {
            this.showMessage("A palavra precisa ter 5 letras.");
            this.boardView.shakeRow(rowIndex);
            return;
        }

        if (!this.wordSet.has(this.currentGuess)) {
            this.showMessage("Essa palavra não está na lista.");
            this.boardView.shakeRow(rowIndex);
            return;
        }

        const guess = this.currentGuess;
        const evaluation = evaluateGuess(guess, this.target, this.wordLength);
        const correct = guess === this.target;

        this.guesses.push(guess);
        this.evaluations.push(evaluation);
        this.currentGuess = "";

        this.boardView.revealRow(rowIndex, guess, evaluation);
        this.keyboardView.update(this.guesses, this.evaluations);
        this.showMessage("");

        if (correct) {
            this.acceptingInput = false;
            this.mode.onWordSolved(this);
            return;
        }

        this.mode.onWrongGuess?.(this);

        if (this.guesses.length >= this.maxAttempts) {
            this.acceptingInput = false;
            this.mode.onWordFailed(this);
            return;
        }

        this.boardView.renderCurrentRow(this.guesses.length, "");
    }

    stop() {
        this.acceptingInput = false;
    }
}
