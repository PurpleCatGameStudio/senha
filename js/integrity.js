const SIGNATURE_SALT = "senha-integrity-v1";

function hashString(value) {
    let hash = 5381;

    for (let index = 0; index < value.length; index += 1) {
        hash = ((hash << 5) + hash + value.charCodeAt(index)) >>> 0;
    }

    return hash.toString(36);
}

export function computeDailySignature({ day, target, guesses, gameOver }) {
    const payload = `${SIGNATURE_SALT}|${day}|${target}|${guesses.join(",")}|${gameOver}`;
    return hashString(payload);
}

export function verifyDailySignature(state) {
    if (!state || typeof state.signature !== "string") {
        return false;
    }

    const expected = computeDailySignature({
        day: state.day,
        target: state.target,
        guesses: Array.isArray(state.guesses) ? state.guesses : [],
        gameOver: Boolean(state.gameOver)
    });

    return expected === state.signature;
}