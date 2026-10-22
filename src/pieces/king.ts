
import { ChessGame } from '../chess_game.js';
import { Piece } from "../piece.js";
import { Rook } from './rook.js';
import { EmptyPiece } from './empty_piece.js';
import { BoardPosition } from '../board_position.js';
import { AnalysisBoard } from '../analysis_board.js';

export class King extends Piece {

    constructor(game: ChessGame, colour: string, i: number, j: number) {
        super(game, colour, "king", i, j);
    }

    override moveOptions(i: number, j: number): void {

        this.kingOptions();
        this.checkCastling();
    }

    override moveTo(position: BoardPosition): void {

        this.game.clearSquare(this.i, this.j);
        this.hasMoved = true;

        this.checkCastlingApplies(position);
        this.i = position.i;
        this.j = position.j;
        this.boardState[this.i][this.j] = this;
    }

    kingOptions() {

        for (let a = -1; a <= 1; a++) {
            for (let b = -1; b <= 1; b++) {
                this.canMove(this.i + a, this.j + b);
            }
        }
    }

    checkCastlingApplies(end: BoardPosition) {

        if (Math.abs(this.j - end.j) == 2) {
            if (this.j > end.j) {
                const rookPiece = this.boardState[this.i][0];
                rookPiece.moveTo(new BoardPosition(this.i, end.j + 1));
            }
            if (this.j < end.j) {
                const rookPiece = this.boardState[this.i][7];
                rookPiece.moveTo(new BoardPosition(this.i, end.j - 1));
            }
        }
    }

    checkCastling() {

        if (!this.hasMoved) {
            this.checkCastleLeft();
            this.checkCastleRight();
        }
    }

    checkCastleLeft() {

        const rookPiece = this.boardState[this.i][0];
        if (rookPiece instanceof Rook && rookPiece.colour === this.colour && !rookPiece.hasMoved) {
            // FIDE: squares b, c, d (1, 2, 3) must all be empty
            const sq1Empty = this.boardState[this.i][1] instanceof EmptyPiece;
            const sq2Empty = this.boardState[this.i][2] instanceof EmptyPiece;
            const sq3Empty = this.boardState[this.i][3] instanceof EmptyPiece;

            if (sq1Empty && sq2Empty && sq3Empty) {
                const analysis = new AnalysisBoard(this.boardState, this.colour);
                // King cannot castle out of check (col 4) or through check (col 3)
                if (!analysis.kingIsThreatened(new BoardPosition(this.i, 4)) &&
                    !analysis.kingIsThreatened(new BoardPosition(this.i, 3))) {
                    this.canMove(this.i, 2);
                }
            }
        }
    }

    checkCastleRight() {

        const rookPiece = this.boardState[this.i][7];
        if (rookPiece instanceof Rook && rookPiece.colour === this.colour && !rookPiece.hasMoved) {
            // FIDE: squares f, g (5, 6) must both be empty
            const sq5Empty = this.boardState[this.i][5] instanceof EmptyPiece;
            const sq6Empty = this.boardState[this.i][6] instanceof EmptyPiece;

            if (sq5Empty && sq6Empty) {
                const analysis = new AnalysisBoard(this.boardState, this.colour);
                // King cannot castle out of check (col 4) or through check (col 5)
                if (!analysis.kingIsThreatened(new BoardPosition(this.i, 4)) &&
                    !analysis.kingIsThreatened(new BoardPosition(this.i, 5))) {
                    this.canMove(this.i, 6);
                }
            }
        }
    }
}