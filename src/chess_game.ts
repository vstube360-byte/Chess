
import { BoardPosition } from "./board_position.js";
import { MoveTracker } from "./move_tracker.js";
import { Piece } from "./piece.js";
import { King } from "./pieces/king.js";
import { Pawn } from "./pieces/pawn.js";
import { Bishop } from "./pieces/bishop.js";
import { Rook } from "./pieces/rook.js";
import { Knight } from "./pieces/knight.js";
import { Queen } from "./pieces/queen.js";
import { EmptyPiece } from "./pieces/empty_piece.js";
import { Observer } from "./observer.js";
import { Subject } from "./subject.js";
import { BoardBuilder } from "./board_builder.js";
import { generateAlgebraicNotation } from "./notation.js";
import { AnalysisBoard } from "./analysis_board.js";

export interface PieceSnapshot {
    name: string;
    colour: string;
    hasMoved: boolean;
    enPassantTurn?: number;
}

export interface GameSnapshot {
    board: PieceSnapshot[][];
    turncount: number;
    state: string;
    lastMoves: MoveRecord[];
    capturedPieces: { w: string[]; b: string[] };
    moveHistory: string[];
    whiteTime?: number;
    blackTime?: number;
    evalScore?: number;
    halfmoveClock?: number;
    positionHistory?: string[];
    fenHistory?: string[];
}

export interface MoveRecord {
    from: BoardPosition;
    to: BoardPosition;
    piece: Piece;
    captured?: { position: BoardPosition, piece: Piece } | null;
    animated?: boolean;
}

export class ChessGame implements Subject {

    public boardState: Piece[][] = new Array<Array<Piece>>(8);
    public moveTracker;
    public turncount: number = 0;
    private observers: Observer[] = [];
    public possibleMoves: number = 0;
    public state: string;
    public boardBuilder: BoardBuilder;
    public lastMoves: MoveRecord[] = [];
    public moveHistory: string[] = [];
    public capturedPieces: { w: string[], b: string[] } = { w: [], b: [] };
    public halfmoveClock: number = 0;
    public positionHistory: string[] = [];
    public fenHistory: string[] = [];

    constructor() {

        this.moveTracker = new MoveTracker(this);
        this.boardBuilder = new BoardBuilder(this);
        this.state = "ongoing";
        this.lastMoves = [];
        this.moveHistory = [];
        this.capturedPieces = { w: [], b: [] };
        this.halfmoveClock = 0;
        this.positionHistory = [];
        this.fenHistory = [];
        this.updateState();
        this.positionHistory = [this.getPositionKey()];
        this.fenHistory = [this.toFEN()];
    }

    submitPromotionChoice(choice: string) : void {
        const pawn: Pawn = this.getPromotingPawn();
        pawn.promoteTo(choice);

        this.state = "ongoing";
        this.updateState();

        if (this.moveHistory.length > 0) {
            const baseNote = this.moveHistory[this.moveHistory.length - 1].replace(/[+#]+$/, "");
            const promoLetter = (choice.toLowerCase() === "knight") ? "=N" : `=${choice[0].toUpperCase()}`;
            const nextPlayer = this.getTurnPlayer();
            const opponentKing = this.getKingOfColour(nextPlayer);
            const suffix = (this.state === "checkmate") ? "#" : (opponentKing.threatened ? "+" : "");
            this.moveHistory[this.moveHistory.length - 1] = baseNote + promoLetter + suffix;
        }

        if (this.positionHistory.length > 0) {
            this.positionHistory[this.positionHistory.length - 1] = this.getPositionKey();
        }
        if (this.fenHistory.length > 0) {
            this.fenHistory[this.fenHistory.length - 1] = this.toFEN();
        }
    }

    getPromotingPawn(): Pawn {

        const i = (this.getTurnPlayer() == "b") ? 0 : 7;

        for (let j = 0; j < 8; j++) {
            const piece: Piece = this.boardState[i][j];
            if (piece instanceof Pawn) {
                return piece;
            }
        }

        return new Pawn(this, "w", 0, 0);
    }

    getPieces() : Piece[] {

        const pieces: Piece[] = []
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = this.boardState[i][j];
                pieces.push(piece);
            }
        }

        return pieces;
    }

    getKingOfColour(colour: string): Piece {

        const pieces = this.getPieces();

        for(let i=0; i<pieces.length; i++){
            if (pieces[i] instanceof King){
                if (pieces[i].colour == colour) {
                    return pieces[i];
                }
            }
        }

        return new EmptyPiece(this, 0, 0);
    }

    resetThreats() : void {

        const pieces = this.getPieces();
        pieces.forEach((piece) => {
            piece.threatened = false;
        })
    }

    attach(observer: Observer): void {

        this.observers.push(observer);
    }

    detach(observer: Observer): void {

        const n = this.observers.length;
        for (let i = 0; i < n; i++) {
            if (this.observers[i] == observer) {
                this.observers.splice(i, 1);
                return;
            }
        }
    }

    notify(): void {

        this.possibleMoves = 0;
        this.observers.forEach((observer) => {
            observer.update(this);
        })
    }

    submitSelection(move: BoardPosition) : Piece {

        this.moveTracker.interpretSelection(move);
        return this.boardState[move.i][move.j];
    }

    getTurnPlayer(): string {

        return (this.turncount % 2 == 0) ? "w" : "b";
    }

    concludeTurn(): void {

        this.turncount += 1;
        this.positionHistory.push(this.getPositionKey());
        this.fenHistory.push(this.toFEN());
        this.updateState();
    }

    updateState(): void {

        this.resetThreats();
        this.notify();
        this.checkGameOver();
    }

    getPositionKey(): string {

        const pieces: string[] = [];
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const p = this.boardState[i][j];
                if (p instanceof EmptyPiece) {
                    pieces.push(".");
                } else {
                    pieces.push(`${p.colour}${p.name[0]}`);
                }
            }
        }
        const turn = this.getTurnPlayer();

        let castling = "";
        const wk = this.boardState[7]?.[4];
        const wkr = this.boardState[7]?.[7];
        const wqr = this.boardState[7]?.[0];
        if (wk instanceof King && !wk.hasMoved) {
            if (wkr instanceof Rook && !wkr.hasMoved) castling += "K";
            if (wqr instanceof Rook && !wqr.hasMoved) castling += "Q";
        }
        const bk = this.boardState[0]?.[4];
        const bkr = this.boardState[0]?.[7];
        const bqr = this.boardState[0]?.[0];
        if (bk instanceof King && !bk.hasMoved) {
            if (bkr instanceof Rook && !bkr.hasMoved) castling += "k";
            if (bqr instanceof Rook && !bqr.hasMoved) castling += "q";
        }
        if (!castling) castling = "-";

        let ep = "-";
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const p = this.boardState[i][j];
                if (p instanceof Pawn && p.enPassantTurn === this.turncount) {
                    ep = `${p.i},${p.j}`;
                }
            }
        }

        return `${pieces.join(",")}|${turn}|${castling}|${ep}`;
    }

    checkInsufficientMaterial(): boolean {

        const pieces = this.getPieces().filter(p => !(p instanceof EmptyPiece));

        if (pieces.some(p => p instanceof Pawn || p instanceof Rook || p instanceof Queen)) {
            return false;
        }

        const whitePieces = pieces.filter(p => p.colour === "w");
        const blackPieces = pieces.filter(p => p.colour === "b");

        const whiteNonKings = whitePieces.filter(p => !(p instanceof King));
        const blackNonKings = blackPieces.filter(p => !(p instanceof King));

        // King vs King
        if (whiteNonKings.length === 0 && blackNonKings.length === 0) {
            return true;
        }

        // King + minor vs King (K+N vs K or K+B vs K)
        if (whiteNonKings.length === 1 && blackNonKings.length === 0) {
            const p = whiteNonKings[0];
            if (p instanceof Knight || p instanceof Bishop) return true;
        }
        if (blackNonKings.length === 1 && whiteNonKings.length === 0) {
            const p = blackNonKings[0];
            if (p instanceof Knight || p instanceof Bishop) return true;
        }

        // King + 2 Knights vs lone King
        if (whiteNonKings.length === 2 && blackNonKings.length === 0) {
            if (whiteNonKings.every(p => p instanceof Knight)) return true;
        }
        if (blackNonKings.length === 2 && whiteNonKings.length === 0) {
            if (blackNonKings.every(p => p instanceof Knight)) return true;
        }

        // King + Bishop vs King + Bishop with same-color bishops
        if (whiteNonKings.length === 1 && blackNonKings.length === 1) {
            const wP = whiteNonKings[0];
            const bP = blackNonKings[0];
            if (wP instanceof Bishop && bP instanceof Bishop) {
                const wColor = (wP.i + wP.j) % 2;
                const bColor = (bP.i + bP.j) % 2;
                if (wColor === bColor) {
                    return true;
                }
            }
        }

        return false;
    }

    checkGameOver(): void {

        if (this.state === "resigned" || this.state === "draw_agreement") {
            return;
        }

        if (this.checkInsufficientMaterial()) {
            this.state = "draw_insufficient";
            return;
        }

        if (this.halfmoveClock >= 150) {
            this.state = "draw_75move";
            return;
        }

        if (this.halfmoveClock >= 100) {
            this.state = "draw_50move";
            return;
        }

        const currentKey = this.getPositionKey();
        const repetitions = this.positionHistory.filter(k => k === currentKey).length;
        if (repetitions >= 5) {
            this.state = "draw_fivefold";
            return;
        }
        if (repetitions >= 3) {
            this.state = "draw_repetition";
            return;
        }

        if (this.possibleMoves == 0) {
            const loser = this.getTurnPlayer();
            const king = this.getKingOfColour(loser);
            this.state = (king.threatened) ? "checkmate" : "stalemate";
        }
    }

    makeMove(movingPiece: Piece, end: BoardPosition) {

        const start = new BoardPosition(movingPiece.i, movingPiece.j);
        let captured: { position: BoardPosition, piece: Piece } | null = null;

        const destPiece = this.boardState[end.i][end.j];
        if (!(destPiece instanceof EmptyPiece)) {
            captured = { position: new BoardPosition(end.i, end.j), piece: destPiece };
        } else if (movingPiece instanceof Pawn && start.j !== end.j) {
            const victim = this.boardState[start.i][end.j];
            if (!(victim instanceof EmptyPiece)) {
                captured = { position: new BoardPosition(start.i, end.j), piece: victim };
            }
        }

        if (movingPiece instanceof Pawn || captured !== null) {
            this.halfmoveClock = 0;
        } else {
            this.halfmoveClock += 1;
        }

        const moves: MoveRecord[] = [
            { from: start, to: end, piece: movingPiece, captured, animated: false }
        ];

        if (movingPiece instanceof King && Math.abs(movingPiece.j - end.j) === 2) {
            if (end.j < movingPiece.j) {
                const rookPiece = this.boardState[movingPiece.i][0];
                moves.push({
                    from: new BoardPosition(movingPiece.i, 0),
                    to: new BoardPosition(movingPiece.i, end.j + 1),
                    piece: rookPiece,
                    animated: false
                });
            } else {
                const rookPiece = this.boardState[movingPiece.i][7];
                moves.push({
                    from: new BoardPosition(movingPiece.i, 7),
                    to: new BoardPosition(movingPiece.i, end.j - 1),
                    piece: rookPiece,
                    animated: false
                });
            }
        }

        this.lastMoves = moves;

        if (captured) {
            this.capturedPieces[movingPiece.colour as "w" | "b"].push(captured.piece.name);
        }

        this.removePiece(end.i, end.j);
        movingPiece.moveTo(end);
        this.concludeTurn();

        // Calculate notation after concludeTurn has updated threats and game state
        const nextPlayer = this.getTurnPlayer();
        const opponentKing = this.getKingOfColour(nextPlayer);
        const isCheck = opponentKing.threatened;
        const isCheckmate = this.state === "checkmate";
        const isCastleKingside = movingPiece instanceof King && (end.j - start.j === 2);
        const isCastleQueenside = movingPiece instanceof King && (start.j - end.j === 2);

        const notation = generateAlgebraicNotation({
            from: start,
            to: end,
            piece: movingPiece,
            isCapture: captured !== null,
            isCheck,
            isCheckmate,
            isCastleKingside,
            isCastleQueenside
        });
        this.moveHistory.push(notation);

        if (movingPiece instanceof Pawn){
            if (end.i == 0 || end.i == 7){
                this.state = "promotion";
            }
        }
    }

    getMaterialCount(): { whiteScore: number, blackScore: number, advantage: string, diff: number } {
        const pieceScores: Record<string, number> = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9 };
        let whiteScore = 0;
        let blackScore = 0;
        const pieces = this.getPieces();
        for (let i = 0; i < pieces.length; i++) {
            const p = pieces[i];
            if (p instanceof EmptyPiece || p instanceof King) continue;
            const score = pieceScores[p.name] || 0;
            if (p.colour === "w") whiteScore += score;
            else if (p.colour === "b") blackScore += score;
        }
        const diff = whiteScore - blackScore;
        let advantage = "equal";
        if (diff > 0) advantage = "w";
        else if (diff < 0) advantage = "b";

        return { whiteScore, blackScore, advantage, diff: Math.abs(diff) };
    }

    clearSquare(i: number, j: number){

        this.boardState[i][j] = new EmptyPiece(this, i, j);
    }

    removePiece(i: number, j: number) {

        const piece: Piece = this.boardState[i][j];
        this.detach(piece);
        this.clearSquare(i, j);
    }

    legalPosition(i: number, j: number, colour: string): boolean {

        if (this.validCoordinates(i, j)) {
            const piece: Piece = this.boardState[i][j];
            if (piece instanceof EmptyPiece || piece.colour != colour) {
                return true;
            }
        }

        return false;
    }

    validCoordinates(i: number, j: number) {

        return (0 <= i && i < 8 && 0 <= j && j < 8);
    }

    createSnapshot(whiteTime?: number, blackTime?: number, evalScore?: number): GameSnapshot {
        const board: PieceSnapshot[][] = [];
        for (let i = 0; i < 8; i++) {
            const row: PieceSnapshot[] = [];
            for (let j = 0; j < 8; j++) {
                const p = this.boardState[i][j];
                const ps: PieceSnapshot = {
                    name: p.name,
                    colour: p.colour,
                    hasMoved: p.hasMoved
                };
                if (p instanceof Pawn) {
                    ps.enPassantTurn = p.enPassantTurn;
                }
                row.push(ps);
            }
            board.push(row);
        }

        const lastMovesCloned: MoveRecord[] = (this.lastMoves || []).map(m => ({
            from: new BoardPosition(m.from.i, m.from.j),
            to: new BoardPosition(m.to.i, m.to.j),
            piece: { name: m.piece.name, colour: m.piece.colour, i: m.piece.i, j: m.piece.j } as any,
            captured: m.captured ? {
                position: new BoardPosition(m.captured.position.i, m.captured.position.j),
                piece: { name: m.captured.piece.name, colour: m.captured.piece.colour, i: m.captured.piece.i, j: m.captured.piece.j } as any
            } : null,
            animated: true
        }));

        return {
            board,
            turncount: this.turncount,
            state: this.state,
            lastMoves: lastMovesCloned,
            capturedPieces: {
                w: [...this.capturedPieces.w],
                b: [...this.capturedPieces.b]
            },
            moveHistory: [...this.moveHistory],
            whiteTime,
            blackTime,
            evalScore,
            halfmoveClock: this.halfmoveClock,
            positionHistory: [...this.positionHistory],
            fenHistory: [...this.fenHistory]
        };
    }

    restoreSnapshot(snapshot: GameSnapshot): void {
        this.turncount = snapshot.turncount;
        this.state = snapshot.state;
        this.halfmoveClock = snapshot.halfmoveClock ?? 0;
        this.positionHistory = snapshot.positionHistory ? [...snapshot.positionHistory] : [this.getPositionKey()];
        this.lastMoves = (snapshot.lastMoves || []).map(m => ({
            from: new BoardPosition(m.from.i, m.from.j),
            to: new BoardPosition(m.to.i, m.to.j),
            piece: m.piece,
            captured: m.captured ? {
                position: new BoardPosition(m.captured.position.i, m.captured.position.j),
                piece: m.captured.piece
            } : null,
            animated: true
        }));
        this.capturedPieces = {
            w: [...snapshot.capturedPieces.w],
            b: [...snapshot.capturedPieces.b]
        };
        this.moveHistory = [...snapshot.moveHistory];

        // Clear existing observers so rebuilt pieces attach cleanly
        this.observers = [];

        // Reconstruct boardState
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const s = snapshot.board[i][j];
                let piece: Piece;
                switch (s.name) {
                    case "pawn": {
                        const pawn = new Pawn(this, s.colour, i, j);
                        if (s.enPassantTurn !== undefined) pawn.enPassantTurn = s.enPassantTurn;
                        piece = pawn;
                        break;
                    }
                    case "rook":
                        piece = new Rook(this, s.colour, i, j);
                        break;
                    case "knight":
                        piece = new Knight(this, s.colour, i, j);
                        break;
                    case "bishop":
                        piece = new Bishop(this, s.colour, i, j);
                        break;
                    case "queen":
                        piece = new Queen(this, s.colour, i, j);
                        break;
                    case "king":
                        piece = new King(this, s.colour, i, j);
                        break;
                    default:
                        piece = new EmptyPiece(this, i, j);
                        break;
                }
                piece.hasMoved = s.hasMoved;
                this.boardState[i][j] = piece;
            }
        }

        this.updateState();
        this.fenHistory = snapshot.fenHistory && snapshot.fenHistory.length > 0 ? [...snapshot.fenHistory] : [this.toFEN()];
    }

    public toFEN(): string {
        let fen = "";
        for (let i = 0; i < 8; i++) {
            let empty = 0;
            for (let j = 0; j < 8; j++) {
                const p = this.boardState[i][j];
                if (!p || p.name === "empty") {
                    empty++;
                } else {
                    if (empty > 0) {
                        fen += empty;
                        empty = 0;
                    }
                    const letter = (p.name === "knight") ? "n" : p.name[0];
                    fen += (p.colour === "w") ? letter.toUpperCase() : letter.toLowerCase();
                }
            }
            if (empty > 0) fen += empty;
            if (i < 7) fen += "/";
        }

        fen += " " + this.getTurnPlayer();

        let castling = "";
        const wk = this.boardState[7][4];
        if (wk && wk.name === "king" && wk.hasMoved === false) {
            const wrK = this.boardState[7][7];
            if (wrK && wrK.name === "rook" && wrK.hasMoved === false) castling += "K";
            const wrQ = this.boardState[7][0];
            if (wrQ && wrQ.name === "rook" && wrQ.hasMoved === false) castling += "Q";
        }
        const bk = this.boardState[0][4];
        if (bk && bk.name === "king" && bk.hasMoved === false) {
            const brK = this.boardState[0][7];
            if (brK && brK.name === "rook" && brK.hasMoved === false) castling += "k";
            const brQ = this.boardState[0][0];
            if (brQ && brQ.name === "rook" && brQ.hasMoved === false) castling += "q";
        }
        fen += " " + (castling || "-");

        let ep = "-";
        if (this.lastMoves && this.lastMoves.length > 0) {
            const lm = this.lastMoves[0];
            if (lm.piece && lm.piece.name === "pawn" && Math.abs(lm.from.i - lm.to.i) === 2) {
                const epRank = (lm.from.i + lm.to.i) / 2;
                ep = String.fromCharCode(97 + lm.from.j) + (8 - epRank);
            }
        }
        fen += " " + ep;
        fen += " " + (this.halfmoveClock || 0);
        fen += " " + (Math.floor(this.turncount / 2) + 1);
        return fen;
    }

    public loadFEN(fen: string): void {
        const parts = fen.trim().split(" ");
        const placement = parts[0];
        const activeCol = parts[1] || "w";

        this.observers = [];
        const rows = placement.split("/");
        for (let i = 0; i < 8; i++) {
            let j = 0;
            for (const char of rows[i]) {
                if (char >= "1" && char <= "8") {
                    const count = parseInt(char, 10);
                    for (let c = 0; c < count; c++) {
                        this.boardState[i][j] = new EmptyPiece(this, i, j);
                        j++;
                    }
                } else {
                    const col = char === char.toUpperCase() ? "w" : "b";
                    const lower = char.toLowerCase();
                    let piece: Piece;
                    switch (lower) {
                        case "p": piece = new Pawn(this, col, i, j); break;
                        case "n": piece = new Knight(this, col, i, j); break;
                        case "b": piece = new Bishop(this, col, i, j); break;
                        case "r": piece = new Rook(this, col, i, j); break;
                        case "q": piece = new Queen(this, col, i, j); break;
                        case "k": piece = new King(this, col, i, j); break;
                        default: piece = new EmptyPiece(this, i, j); break;
                    }
                    this.boardState[i][j] = piece;
                    j++;
                }
            }
        }

        this.turncount = (activeCol === "w") ? 0 : 1;
        this.lastMoves = [];
        this.moveHistory = [];
        this.capturedPieces = { w: [], b: [] };
        this.halfmoveClock = 0;
        this.state = "ongoing";
        this.positionHistory = [];
        this.updateState();
        this.positionHistory = [this.getPositionKey()];
        this.fenHistory = [fen.trim()];
    }

    public createPieceByName(name: string, colour: string, i: number, j: number): Piece {
        let piece: Piece;
        switch (name) {
            case "pawn": piece = new Pawn(this, colour, i, j); break;
            case "rook": piece = new Rook(this, colour, i, j); break;
            case "knight": piece = new Knight(this, colour, i, j); break;
            case "bishop": piece = new Bishop(this, colour, i, j); break;
            case "queen": piece = new Queen(this, colour, i, j); break;
            case "king": piece = new King(this, colour, i, j); break;
            default: piece = new EmptyPiece(this, i, j); break;
        }
        this.normalizePieceHasMoved(piece);
        return piece;
    }

    public normalizePieceHasMoved(piece: Piece): void {
        if (piece instanceof EmptyPiece) return;
        const { name, colour, i, j } = piece;
        if (name === "pawn") {
            piece.hasMoved = !((colour === "w" && i === 6) || (colour === "b" && i === 1));
        } else if (name === "king") {
            piece.hasMoved = !((colour === "w" && i === 7 && j === 4) || (colour === "b" && i === 0 && j === 4));
        } else if (name === "rook") {
            piece.hasMoved = !((colour === "w" && i === 7 && (j === 0 || j === 7)) || (colour === "b" && i === 0 && (j === 0 || j === 7)));
        } else {
            piece.hasMoved = false;
        }
    }

    public setEditorPiece(i: number, j: number, name: string, colour: string): boolean {
        if (!this.validCoordinates(i, j)) return false;
        this.removePiece(i, j);
        if (name && name !== "empty") {
            this.boardState[i][j] = this.createPieceByName(name, colour, i, j);
        }
        this.lastMoves = [];
        this.moveTracker.active = false;
        this.resetThreats();
        return true;
    }

    public moveEditorPiece(fromI: number, fromJ: number, toI: number, toJ: number): boolean {
        if (!this.validCoordinates(fromI, fromJ) || !this.validCoordinates(toI, toJ)) return false;
        if (fromI === toI && fromJ === toJ) return false;
        const src = this.boardState[fromI][fromJ];
        if (!src || src instanceof EmptyPiece) return false;

        const name = src.name;
        const colour = src.colour;
        this.removePiece(fromI, fromJ);
        this.removePiece(toI, toJ);
        this.boardState[toI][toJ] = this.createPieceByName(name, colour, toI, toJ);
        this.lastMoves = [];
        this.moveTracker.active = false;
        this.resetThreats();
        return true;
    }

    public clearBoardToKings(): void {
        let nonKingCount = 0;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const p = this.boardState[i][j];
                if (!(p instanceof EmptyPiece) && !(p instanceof King)) {
                    nonKingCount++;
                }
            }
        }
        this.observers = [];
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                this.boardState[i][j] = new EmptyPiece(this, i, j);
            }
        }
        if (nonKingCount > 0) {
            this.boardState[7][4] = this.createPieceByName("king", "w", 7, 4);
            this.boardState[0][4] = this.createPieceByName("king", "b", 0, 4);
        }
        this.lastMoves = [];
        this.moveTracker.active = false;
        this.resetThreats();
    }

    public validateAndStartCustomGame(startingColour: string = "w"): { valid: boolean; error?: string } {
        let whiteKings = 0;
        let blackKings = 0;

        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const p = this.boardState[i][j];
                if (p instanceof EmptyPiece) continue;
                this.normalizePieceHasMoved(p);
                if (p instanceof King) {
                    if (p.colour === "w") {
                        whiteKings++;
                    } else {
                        blackKings++;
                    }
                }
            }
        }

        if (whiteKings < 1 || blackKings < 1) {
            return {
                valid: false,
                error: `Board needs at least 1 White King (${whiteKings}) and 1 Black King (${blackKings}).`
            };
        }

        this.turncount = startingColour === "w" ? 0 : 1;
        this.lastMoves = [];
        this.moveHistory = [];
        this.capturedPieces = { w: [], b: [] };
        this.halfmoveClock = 0;
        this.state = "ongoing";
        this.moveTracker.active = false;
        this.positionHistory = [];
        this.updateState();
        this.positionHistory = [this.getPositionKey()];
        this.fenHistory = [this.toFEN()];
        return { valid: true };
    }
}
