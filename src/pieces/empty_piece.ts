

import { ChessGame } from '../chess_game.js';
import { Piece } from "../piece.js";

export class EmptyPiece extends Piece {

    constructor(game: ChessGame, i:number, j:number) {
        super(game, "x", "empty", i, j);
    }

    override moveOptions(i: number, j: number): void {

        return;
    }
}