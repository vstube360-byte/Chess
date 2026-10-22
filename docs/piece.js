import { BoardPosition } from './board_position.js';
import { AnalysisBoard } from './analysis_board.js';
export class Piece {
    constructor(game, colour, name, i, j) {
        this.possibleMoves = [];
        this.hasMoved = false;
        this.boardState = game.boardState;
        this.game = game;
        this.colour = colour;
        this.name = name;
        this.i = i;
        this.j = j;
        this.threatened = false;
        if (name !== "empty") {
            game.attach(this);
        }
    }
    update(subject) {
        this.possibleMoves = [];
        this.moveOptions(this.i, this.j);
        if (this.colour == this.game.getTurnPlayer()) {
            this.game.possibleMoves += this.possibleMoves.length;
        }
    }
    moveOptions(i, j) { }
    invalidCoordinates(i, j) {
        return !this.game.validCoordinates(i, j);
    }
    isSafeMove(destination) {
        const start = new BoardPosition(this.i, this.j);
        const analysisBoard = new AnalysisBoard(this.boardState, this.colour);
        analysisBoard.submitMove(start, destination);
        return analysisBoard.isSafe();
    }
    canMove(i, j) {
        if (this.game.legalPosition(i, j, this.colour)) {
            const move = new BoardPosition(i, j);
            if (this.isSafeMove(move)) {
                const targetPiece = this.boardState[i][j];
                targetPiece.threatened = true;
                this.possibleMoves.push(move);
            }
            return true;
        }
        return false;
    }
    checkAlongImpulse(position, di, dj) {
        var i = position.i + di;
        var j = position.j + dj;
        while (this.canMove(i, j) == true) {
            const piece = this.boardState[i][j];
            if (piece.colour == "b" || piece.colour == "w") {
                break;
            }
            i += di;
            j += dj;
        }
    }
    moveTo(position) {
        this.game.clearSquare(this.i, this.j);
        this.hasMoved = true;
        this.i = position.i;
        this.j = position.j;
        this.boardState[this.i][this.j] = this;
    }
    inMoveOptions(i, j) {
        const n = this.possibleMoves.length;
        for (let index = 0; index < n; index++) {
            const position = this.possibleMoves[index];
            if (position.i == i && position.j == j) {
                return true;
            }
        }
        return false;
    }
}
