import { Piece } from "../piece.js";
import { BoardPosition } from '../board_position.js';
export class Bishop extends Piece {
    constructor(game, colour, i, j) {
        super(game, colour, "bishop", i, j);
    }
    moveOptions(i, j) {
        this.bishopOptions(i, j);
    }
    bishopOptions(i, j) {
        const position = new BoardPosition(i, j);
        this.checkAlongImpulse(position, -1, 1);
        this.checkAlongImpulse(position, 1, 1);
        this.checkAlongImpulse(position, 1, -1);
        this.checkAlongImpulse(position, -1, -1);
    }
}
