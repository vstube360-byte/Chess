

import { ChessGame } from '../chess_game.js';
import { Piece } from "../piece.js";
import { BoardPosition } from '../board_position.js';

export class Queen extends Piece {

    constructor(game: ChessGame, colour: string, i:number, j:number) {
        super(game, colour, "queen", i, j);
    }

    override moveOptions(i: number, j: number): void {

        this.queenOptions(i, j);
    }

    queenOptions(i: number, j: number){

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