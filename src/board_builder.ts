

import { Piece } from "./piece.js";
import { Bishop } from "./pieces/bishop.js";
import { Rook } from "./pieces/rook.js";
import { Knight } from "./pieces/knight.js";
import { King } from "./pieces/king.js";
import { Pawn } from "./pieces/pawn.js";
import { Queen } from "./pieces/queen.js";
import { EmptyPiece } from "./pieces/empty_piece.js";
import { ChessGame } from "./chess_game.js";

export class BoardBuilder{

    public boardState: Piece[][];
    public game: ChessGame;

    constructor(game: ChessGame){

        this.boardState = game.boardState;
        this.game = game;
        this.initializeboardState();
    }

    initializeboardState() {

        for (let i = 0; i < 8; i++) {
            this.boardState[i] = new Array<Piece>(8);
            for (let j = 0; j < 8; j++) {
                this.boardState[i][j] = new EmptyPiece(this.game, i, j);
            }
        }

        this.placeBlackPieces();
        this.placeWhitePieces();
    }

    placeBlackPieces() {

        for (let j = 0; j < 8; j++) {
            this.boardState[1][j] = new Pawn(this.game, "b", 1, j)
        }

        this.boardState[0][0] = new Rook(this.game, "b", 0, 0)
        this.boardState[0][1] = new Knight(this.game, "b", 0, 1)
        this.boardState[0][2] = new Bishop(this.game, "b", 0, 2)
        this.boardState[0][3] = new Queen(this.game, "b", 0, 3)

        this.boardState[0][4] = new King(this.game, "b", 0, 4)
        this.boardState[0][5] = new Bishop(this.game, "b", 0, 5)
        this.boardState[0][6] = new Knight(this.game, "b", 0, 6)
        this.boardState[0][7] = new Rook(this.game, "b", 0, 7)
    }

    placeWhitePieces() {

        for (let j = 0; j < 8; j++) {
            this.boardState[6][j] = new Pawn(this.game, "w", 6, j)
        }

        this.boardState[7][0] = new Rook(this.game, "w", 7, 0)
        this.boardState[7][1] = new Knight(this.game, "w", 7, 1)
        this.boardState[7][2] = new Bishop(this.game, "w", 7, 2)
        this.boardState[7][3] = new Queen(this.game, "w", 7, 3)

        this.boardState[7][4] = new King(this.game, "w", 7, 4)
        this.boardState[7][5] = new Bishop(this.game, "w", 7, 5)
        this.boardState[7][6] = new Knight(this.game, "w", 7, 6)
        this.boardState[7][7] = new Rook(this.game, "w", 7, 7)
    }
}