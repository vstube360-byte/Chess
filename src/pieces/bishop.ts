

import { ChessGame } from '../chess_game.js';
import { Piece } from "../piece.js";
import { BoardPosition } from '../board_position.js';


export class Bishop extends Piece {

    constructor(game: ChessGame, colour: string, i:number, j:number) {
        super(game, colour, "bishop", i, j);
    }

    override moveOptions(i: number, j: number): void {

        this.bishopOptions(i, j);
    }
    
    bishopOptions(i: number, j: number) {
        
        const position = new BoardPosition(i, j);

        this.checkAlongImpulse(position, -1, 1);
        this.checkAlongImpulse(position, 1, 1);
        this.checkAlongImpulse(position, 1, -1);
        this.checkAlongImpulse(position, -1, -1);
    }
}