import { Piece } from "../piece.js";
import { BoardPosition } from '../board_position.js';
export class Queen extends Piece {
    constructor(game, colour, i, j) {
        super(game, colour, "queen", i, j);
    }
    moveOptions(i, j) {
        this.queenOptions(i, j);
    }
    queenOptions(i, j) {
        const position = new BoardPosition(i, j);
        this.checkAlongImpulse(position, -1, 0);
        this.checkAlongImpulse(position, 1, 0);
        this.checkAlongImpulse(position, 0, -1);
        this.checkAlongImpulse(position, 0, 1);
        this.checkAlongImpulse(position, -1, 1);
        this.checkAlongImpulse(position, 1, 1);
        this.checkAlongImpulse(position, 1, -1);
        this.checkAlongImpulse(position, -1, -1);
    }
}
