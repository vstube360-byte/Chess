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
        const colour: string = (piece.colour == "b") ? "Black" : "White";
        const bigText = `Promote ${colour} Pawn`;
        const subText = "Select a piece to promote to:";
        return this.createEndCard(bigText, subText);
    }

    createEndCard(bigText: string, subText: string): HTMLDivElement {
        const card = document.createElement("div");
        card.classList.add("end-card");

        const header1 = document.createElement("h2");
        header1.innerText = bigText;
        card.appendChild(header1);

        const desc = document.createElement("p");
        desc.classList.add("end-card-desc");
        desc.innerText = subText;
        card.appendChild(desc);

        const actions = document.createElement("div");
        actions.classList.add("end-card-actions");

        const options: string[] = ["Queen", "Rook", "Bishop", "Knight"];
        for (let i = 0; i < options.length; i++) {
            const optionText = options[i];
            const optionBtn = document.createElement("button");
            optionBtn.className = i === 0 ? "btn-play-again" : "btn-review";
            optionBtn.innerText = optionText;
            optionBtn.addEventListener("click", () => {
                this.submitChoice(optionText);
            });
            actions.appendChild(optionBtn);
        }

        card.appendChild(actions);
        return card;
    }

    submitChoice(text: string): void {
        this.game.submitPromotionChoice(text);
        this.element.remove();
        this.parent.onPromotionChoiceSubmitted();
    }
}