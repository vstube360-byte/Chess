import { Piece } from "../piece.js";
import { EmptyPiece } from './empty_piece.js';
import { Bishop } from './bishop.js';
import { Knight } from './knight.js';
import { Rook } from './rook.js';
import { Queen } from './queen.js';
export class Pawn extends Piece {
    constructor(game, colour, i, j) {
        super(game, colour, "pawn", i, j);
        this.enPassantTurn = -1;
    }
    moveOptions(i, j) {
        switch (this.colour) {
            case "b":
                this.blackPawnOptions(i, j);
                return;
            default:
                this.whitePawnOptions(i, j);
                return;
        }
    }
    moveTo(position) {
        this.game.clearSquare(this.i, this.j);
        if (Math.abs(this.i - position.i) == 2) {
            this.enPassantTurn = this.game.turncount + 1;
        }
        this.checkCaptureEnPassant(position);
        this.hasMoved = true;
        this.i = position.i;
        this.j = position.j;
        this.boardState[this.i][this.j] = this;
    }
    checkCaptureEnPassant(end) {
        var targetPiece = this.boardState[end.i][end.j];
        // en passant
        if (this.j != end.j && targetPiece instanceof EmptyPiece) {
            const victim = this.boardState[this.i][end.j];
            if (victim instanceof Pawn && victim.enPassantTurn == this.game.turncount) {
                this.game.removePiece(this.i, end.j);
            }
        }
    }
    pawnMove(i, j) {
        if (this.game.validCoordinates(i, j)) {
            const destination = this.boardState[i][j];
            if (destination instanceof EmptyPiece) {
                this.canMove(i, j);
                return true;
            }
        }
        return false;
    }
    pawnCapture(i, j) {
        if (this.game.validCoordinates(i, j)) {
            const targetPiece = this.boardState[i][j];
            if (targetPiece instanceof EmptyPiece || targetPiece.colour == this.colour) {
                return;
            }
            this.canMove(i, j);
        }
    }
    checkEnPassant(i, j) {
        if (!this.game.validCoordinates(i, j)) {
            return;
        }
        const targetPiece = this.boardState[i][j];
        if (targetPiece instanceof Pawn) {
            if (targetPiece.enPassantTurn == this.game.turncount) {
                if (this.colour == "b" && this.game.legalPosition(i + 1, j, this.colour)) {
                    this.canMove(i + 1, j);
                }
                if (this.colour == "w" && this.game.legalPosition(i - 1, j, this.colour)) {
                    this.canMove(i - 1, j);
                }
            }
        }
    }
    blackPawnOptions(i, j) {
        if (this.pawnMove(i + 1, j) === true) {
            // starting bonus
            if (i === 1) {
                this.pawnMove(i + 2, j);
            }
        }
        // capture diagonals
        this.pawnCapture(i + 1, j - 1);
        this.pawnCapture(i + 1, j + 1);
        // en passant
        this.checkEnPassant(i, j + 1);
        this.checkEnPassant(i, j - 1);
    }
    whitePawnOptions(i, j) {
        if (this.pawnMove(i - 1, j) === true) {
            // starting bonus
            if (i === 6) {
                this.pawnMove(i - 2, j);
            }
        }
        // capture diagonals
        this.pawnCapture(i - 1, j - 1);
        this.pawnCapture(i - 1, j + 1);
        // en passant
        this.checkEnPassant(i, j + 1);
        this.checkEnPassant(i, j - 1);
    }
    promoteTo(choice) {
        const newPiece = this.getPromotionPiece(choice);
        this.game.removePiece(this.i, this.j);
        this.boardState[this.i][this.j] = newPiece;
    }
    getPromotionPiece(choice) {
        switch (choice) {
            case "Bishop":
                return new Bishop(this.game, this.colour, this.i, this.j);
            case "Knight":
                return new Knight(this.game, this.colour, this.i, this.j);
            case "Rook":
                return new Rook(this.game, this.colour, this.i, this.j);
            default:
                return new Queen(this.game, this.colour, this.i, this.j);
        }
    }
}
