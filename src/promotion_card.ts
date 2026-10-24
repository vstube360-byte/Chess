import { WebChessGame } from "./web_chess_game.js";
import { ChessGame } from "./chess_game.js";
import { Pawn } from "./pieces/pawn.js";

export class PromotionCard {
    public parent: WebChessGame;
    public game: ChessGame;
    public element: HTMLDivElement;

    constructor(parent: WebChessGame, game: ChessGame) {
        this.game = game;
        this.parent = parent;
        this.element = this.deriveEndCard(this.game);
    }

    deriveEndCard(game: ChessGame): HTMLDivElement {
        const piece: Pawn = game.getPromotingPawn();
        const colourCode: string = piece.colour === "b" ? "b" : "w";
        const colourName: string = colourCode === "b" ? "Black" : "White";
        const bigText = `Promote ${colourName} Pawn`;
        const subText = "Choose a piece to promote to:";
        return this.createEndCard(bigText, subText, colourCode);
    }

    createEndCard(bigText: string, subText: string, colourCode: string): HTMLDivElement {
        const card = document.createElement("div");
        card.classList.add("end-card", "promotion-picker-card");

        const header1 = document.createElement("h2");
        header1.innerText = bigText;
        card.appendChild(header1);

        const desc = document.createElement("p");
        desc.classList.add("end-card-desc");
        desc.innerText = subText;
        card.appendChild(desc);

        const grid = document.createElement("div");
        grid.classList.add("promotion-grid");

        const options: string[] = ["Queen", "Rook", "Bishop", "Knight"];
        for (let i = 0; i < options.length; i++) {
            const optionText = options[i];
            const optionBtn = document.createElement("button");
            optionBtn.type = "button";
            optionBtn.className = `promotion-piece-btn${i === 0 ? " primary-choice" : ""}`;
            optionBtn.title = `Promote to ${optionText}`;

            const img = document.createElement("img");
            img.className = "promotion-piece-img";
            img.src = `assets/${optionText.toLowerCase()}_${colourCode}.png`;
            img.alt = optionText;

            const label = document.createElement("span");
            label.className = "promotion-piece-label";
            label.innerText = optionText;

            optionBtn.appendChild(img);
            optionBtn.appendChild(label);
            optionBtn.addEventListener("click", () => {
                this.submitChoice(optionText);
            });
            grid.appendChild(optionBtn);
        }

        card.appendChild(grid);
        return card;
    }

    submitChoice(text: string): void {
        this.game.submitPromotionChoice(text);
        this.element.remove();
        this.parent.onPromotionChoiceSubmitted();
    }
}