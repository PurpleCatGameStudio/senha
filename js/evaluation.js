export const TileStatus = Object.freeze({
    CORRECT: "correct",
    PRESENT: "present",
    ABSENT: "absent"
});

export function evaluateGuess(guess, target, wordLength) {
    const result = Array(wordLength).fill(TileStatus.ABSENT);
    const remaining = target.split("");

    for (let index = 0; index < wordLength; index++) {
        if (guess[index] === target[index]) {
            result[index] = TileStatus.CORRECT;
            remaining[index] = null;
        }
    }

    for (let index = 0; index < wordLength; index++) {
        if (result[index] !== TileStatus.ABSENT) {
            continue;
        }

        const remainingIndex = remaining.indexOf(guess[index]);

        if (remainingIndex !== -1) {
            result[index] = TileStatus.PRESENT;
            remaining[remainingIndex] = null;
        }
    }

    return result;
}
