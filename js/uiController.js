export class UIController {
    constructor(refs) {
        this.refs = refs;
    }

    setModeTitle(title) {
        this.refs.modeTitle.textContent = title;
    }

        configureMeta({ showTimer = false, showScore = false, showStreak = false, showRecord = false, showDevReset = false }) {
        this.refs.timerMetaItem.classList.toggle("hidden", !showTimer);
        this.refs.scoreMetaItem.classList.toggle("hidden", !showScore);
        this.refs.streakMetaItem.classList.toggle("hidden", !showStreak);
        this.refs.recordMetaItem.classList.toggle("hidden", !showRecord);
        this.refs.devResetButton.classList.toggle("hidden", !showDevReset);
        this.refs.devResetAttemptsButton.classList.toggle("hidden", !showDevReset);
    }

    updateTimer(totalSeconds) {
        const clamped = Math.max(0, totalSeconds);
        const minutes = Math.floor(clamped / 60).toString().padStart(2, "0");
        const seconds = Math.floor(clamped % 60).toString().padStart(2, "0");

        this.refs.timerValue.textContent = `${minutes}:${seconds}`;
    }

    updateScore(value) {
        this.refs.scoreValue.textContent = value.toString();
    }

    updateStreak(value) {
        this.refs.streakValue.textContent = value.toString();
    }

    updateRecord(value) {
        this.refs.recordValue.textContent = value.toString();
    }

    showResult({ title, answer, message, extraLine, showCountdown }) {
        this.refs.statsElement.classList.remove("hidden");
        this.refs.resultTitleElement.textContent = title;
        this.refs.answerElement.textContent = answer;

        if (extraLine) {
            this.refs.extraLineElement.textContent = extraLine;
            this.refs.extraLineElement.classList.remove("hidden");
        } else {
            this.refs.extraLineElement.classList.add("hidden");
        }

        this.refs.countdownWrapperElement.classList.toggle("hidden", !showCountdown);

        if (message !== undefined) {
            this.refs.messageElement.textContent = message;
        }
    }

    hideResult() {
        this.refs.statsElement.classList.add("hidden");
    }

    showMessage(text) {
        this.refs.messageElement.textContent = text;
    }

    updateCountdown(text) {
        this.refs.countdownElement.textContent = text;
    }

    showTamperAlert() {
        this.refs.tamperOverlay.classList.remove("hidden");
    }

    hideTamperAlert() {
        this.refs.tamperOverlay.classList.add("hidden");
    }
}
