export class PromotionCard {
    constructor(parent, game) {
        this.game = game;
        this.parent = parent;
        this.element = this.deriveEndCard(this.game);
    }
    deriveEndCard(game) {
        const piece = game.getPromotingPawn();
        const colour = (piece.colour == "b") ? "Black" : "White";
        const bigText = `Promote ${colour} Pawn`;
        const subText = "Select a piece to promote to:";
        return this.createEndCard(bigText, subText);
    }
    createEndCard(bigText, subText) {
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

        const options = ["Queen", "Rook", "Bishop", "Knight"];
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
    submitChoice(text) {
        this.game.submitPromotionChoice(text);
        this.element.remove();
        this.parent.onPromotionChoiceSubmitted();
    }
}
