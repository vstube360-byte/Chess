import { Piece } from "../piece.js";
export class EmptyPiece extends Piece {
    constructor(game, i, j) {
        super(game, "x", "empty", i, j);
    }
    moveOptions(i, j) {
        return;
    }
}
