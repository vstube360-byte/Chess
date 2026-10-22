import { WebChessGame } from "./web_chess_game.js";
import { ChessGame } from "./chess_game.js";

export interface EndCardDetails {
    title: string;
    description: string;
    isDraw: boolean;
}

export class EndCard {

    public parent: WebChessGame;
    public game: ChessGame;
    public element: HTMLDivElement;

    constructor(parent: WebChessGame, game: ChessGame) {

        this.game = game;
        this.parent = parent;
        this.element = this.deriveEndCard(this.game);
    }

    deriveEndCard(game: ChessGame): HTMLDivElement {

        const details = this.getGamestateDetails(game);
        return this.createEndCard(details);
    }

    getGamestateDetails(game: ChessGame): EndCardDetails {

        switch (game.state) {
            case "checkmate": {
                const loser = game.getTurnPlayer();
                const winner = (loser === "w") ? "Black" : "White";
                return {
                    title: `Checkmate. ${winner} wins`,
                    description: `${loser === "w" ? "White" : "Black"} King is in checkmate with no legal moves.`,
                    isDraw: false
                };
            }

            case "timeout": {
                const timeoutLoser = game.getTurnPlayer();
                const timeoutWinner = (timeoutLoser === "w") ? "Black" : "White";
                return {
                    title: `Time out. ${timeoutWinner} wins`,
                    description: `${timeoutLoser === "w" ? "White" : "Black"} ran out of time on the clock.`,
                    isDraw: false
                };
            }

            case "resigned": {
                const resigned = game.getTurnPlayer();
                const winner = (resigned === "w") ? "Black" : "White";
                return {
                    title: `${resigned === "w" ? "White" : "Black"} Resigned`,
                    description: `${winner} wins by resignation.`,
                    isDraw: false
                };
            }

            case "draw_insufficient":
                return {
                    title: "Draw by Insufficient Material",
                    description: "Neither player has enough pieces remaining to deliver checkmate.",
                    isDraw: true
                };

            case "draw_fivefold":
                return {
                    title: "Draw by Fivefold Repetition",
                    description: "The exact same position occurred 5 times (mandatory FIDE draw).",
                    isDraw: true
                };

            case "draw_repetition":
                return {
                    title: "Draw by Threefold Repetition",
                    description: "The exact same board position occurred three times.",
                    isDraw: true
                };

            case "draw_75move":
                return {
                    title: "Draw by 75-Move Rule",
                    description: "75 moves elapsed without any capture or pawn movement (mandatory FIDE draw).",
                    isDraw: true
                };

            case "draw_50move":
                return {
                    title: "Draw by 50-Move Rule",
                    description: "50 full moves elapsed without any capture or pawn movement.",
                    isDraw: true
                };

            case "draw_agreement":
                return {
                    title: "Draw by Mutual Agreement",
                    description: "Both players accepted a peaceful draw.",
                    isDraw: true
                };

            case "stalemate":
                return {
                    title: "Draw by Stalemate",
                    description: "The active player has no legal moves and is not in check.",
                    isDraw: true
                };

            default:
                return {
                    title: "Game Drawn",
                    description: "The game has ended in a draw.",
                    isDraw: true
                };
        }
    }

    createEndCard(details: EndCardDetails): HTMLDivElement {

        const card = document.createElement("div");
        card.classList.add("end-card");
        if (details.isDraw) {
            card.classList.add("draw-result");
        }

        const header1 = document.createElement("h2");
        header1.innerText = details.title;
        card.appendChild(header1);

        const desc = document.createElement("p");
        desc.classList.add("end-card-desc");
        desc.innerText = details.description;
        card.appendChild(desc);

        // Stats summary
        const totalMoves = Math.ceil(this.game.turncount / 2);
        const statsEl = document.createElement("div");
        statsEl.classList.add("end-card-stats");
        statsEl.innerHTML = `
            <span class="stat-pill">${totalMoves} ${totalMoves === 1 ? 'Move' : 'Moves'}</span>
            <span class="stat-pill">${details.isDraw ? '1/2 - 1/2' : 'Final'}</span>
        `;
        card.appendChild(statsEl);

        const actions = document.createElement("div");
        actions.classList.add("end-card-actions");

        const reviewBtn = document.createElement("button");
        reviewBtn.classList.add("btn-review");
        reviewBtn.innerText = "Review Board";
        reviewBtn.addEventListener("click", () => {
            this.parent.endCardDismissed = true;
            card.remove();
        });
        actions.appendChild(reviewBtn);

        const playAgainBtn = document.createElement("button");
        playAgainBtn.classList.add("btn-play-again");
        playAgainBtn.innerText = "New Game";
        playAgainBtn.addEventListener("click", () => {
            this.parent.newGame();
        });
        actions.appendChild(playAgainBtn);

        card.appendChild(actions);

        return card;
    }
}