const STATUS_PRIORITY = Object.freeze({
    absent: 1,
    present: 2,
    correct: 3
});

export class KeyboardView {
    constructor(element, rows, onKeyPress) {
        this.element = element;
        this.rows = rows;
        this.onKeyPress = onKeyPress;
        this.buttons = new Map();
        this.build();
    }

    build() {
        this.element.innerHTML = "";
        this.buttons.clear();

        this.rows.forEach(row => {
            const rowElement = document.createElement("div");

            rowElement.className = "keyboard-row";

            row.forEach(key => {
                const button = document.createElement("button");

                button.type = "button";
                button.className = "key";
                button.textContent = key === "BACKSPACE" ? "⌫" : key;
                button.dataset.key = key;

                if (key === "ENTER" || key === "BACKSPACE") {
                    button.classList.add("wide");
                }

                button.addEventListener("click", () => this.onKeyPress(key));

                rowElement.appendChild(button);
                this.buttons.set(key, button);
            });

            this.element.appendChild(rowElement);
        });
    }

    reset() {
        this.buttons.forEach(button => {
            button.classList.remove("correct", "present", "absent");
        });
    }

    update(guesses, evaluations) {
        const statuses = new Map();

        guesses.forEach((guess, row) => {
            [...guess].forEach((letter, column) => {
                const status = evaluations[row][column];
                const current = statuses.get(letter);

                if (STATUS_PRIORITY[status] > (STATUS_PRIORITY[current] ?? 0)) {
                    statuses.set(letter, status);
                }
            });
        });

        this.buttons.forEach((button, key) => {
            button.classList.remove("correct", "present", "absent");

            if (statuses.has(key)) {
                button.classList.add(statuses.get(key));
            }
        });
    }
}
