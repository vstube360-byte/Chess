import { Piece } from "../piece.js";
import { BoardPosition } from '../board_position.js';
export class Rook extends Piece {
    constructor(game, colour, i, j) {
        super(game, colour, "rook", i, j);
    }
    moveOptions(i, j) {
        this.rookOptions(i, j);
    }
    rookOptions(i, j) {
        const position = new BoardPosition(i, j);
        this.checkAlongImpulse(position, -1, 0);
        this.checkAlongImpulse(position, 1, 0);
        this.checkAlongImpulse(position, 0, -1);
        this.checkAlongImpulse(position, 0, 1);
    }
}
