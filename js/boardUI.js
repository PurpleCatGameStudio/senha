export class BoardView {
    constructor(element, wordLength, maxAttempts) {
        this.element = element;
        this.wordLength = wordLength;
        this.maxAttempts = maxAttempts;
        this.tiles = [];
        this.build();
    }

    build() {
        this.element.innerHTML = "";
        this.tiles = [];

        for (let row = 0; row < this.maxAttempts; row++) {
            const rowTiles = [];

            for (let column = 0; column < this.wordLength; column++) {
                const tile = document.createElement("div");

                tile.className = "tile";
                tile.dataset.row = row;
                tile.dataset.column = column;

                this.element.appendChild(tile);
                rowTiles.push(tile);
            }

            this.tiles.push(rowTiles);
        }
    }

    clearBoard() {
        this.tiles.forEach(row => {
            row.forEach(tile => {
                tile.textContent = "";
                tile.className = "tile";
                tile.style.animationDelay = "";
            });
        });
    }

    renderCurrentRow(rowIndex, currentGuess) {
        const row = this.tiles[rowIndex];

        if (!row) {
            return;
        }

        row.forEach((tile, column) => {
            const letter = currentGuess[column] ?? "";

            tile.textContent = letter;
            tile.classList.toggle("filled", Boolean(letter));
        });
    }

    revealRow(rowIndex, guess, evaluation) {
        const row = this.tiles[rowIndex];

        if (!row) {
            return;
        }

        row.forEach((tile, column) => {
            tile.textContent = guess[column];
            tile.style.animationDelay = `${column * 80}ms`;
            tile.classList.add("filled", "revealed", evaluation[column]);
        });
    }

    shakeRow(rowIndex) {
        const row = this.tiles[rowIndex];

        if (!row) {
            return;
        }

        row.forEach(tile => {
            tile.classList.remove("shake");
            void tile.offsetWidth;
            tile.classList.add("shake");
        });
    }
}
