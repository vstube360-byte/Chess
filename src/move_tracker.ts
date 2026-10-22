
import { BoardPosition } from "./board_position.js";
import { ChessGame } from "./chess_game.js";
import { Piece } from "./piece.js";
import { EmptyPiece } from "./pieces/empty_piece.js";

export class MoveTracker {

    public game: ChessGame;
    public active: boolean = false;
    public activePiece: Piece;

    constructor(game: ChessGame){

        this.game = game;
        this.activePiece = new EmptyPiece(game, 0, 0);
    }

    interpretSelection(move: BoardPosition) {

        if (this.active){
            this.processEndCell(move);
        } else {
            this.processStartMove(move);
        }
    }

    processStartMove(move: BoardPosition) {

        if (this.validStart(move.i, move.j)) {
            this.active = true;
            this.activePiece = this.game.boardState[move.i][move.j];
        }
    }

    processEndCell(move: BoardPosition) {

        this.active = false;
        if (this.validEnd(move.i, move.j)) {
            const endMove = new BoardPosition(move.i, move.j);
            this.game.makeMove(this.activePiece, endMove);
        } else {
            this.game.notify();
            this.processStartMove(move);
        }
    }

    validStart(i: number, j: number): boolean {

        const piece = this.game.boardState[i][j];
        return piece.colour == this.game.getTurnPlayer();
    }

    validEnd(i: number, j: number): boolean {

        const piece: Piece = this.activePiece;
        const moves = piece.possibleMoves;

        for (let k = 0; k < moves.length; k++) {
            const move: BoardPosition = moves[k];
            if (move.i == i && move.j == j) {
                return true;
            }
        }
        return false;
    }
}