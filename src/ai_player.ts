import { Piece } from "./piece.js";
import { ChessGame } from "./chess_game.js";
import { EmptyPiece } from "./pieces/empty_piece.js";
import { getBookMove } from "./opening_book.js";
import { generateAlgebraicNotation } from "./notation.js";
import { BoardPosition } from "./board_position.js";
import { maiaEngine } from "./maia_engine.js";

export interface BotProfile {
    name: string;
    elo: number;
    maiaModel?: string;
    temperature?: number;
    depth: number;
    blunderRate: number;
    noise: number;
    bookDepth: number;
    minDelay: number;
    maxDelay: number;
}

export interface MoveOption {
    piece: Piece;
    destination: BoardPosition;
    uci?: string;
}

export const PIECE_VALUES: Record<string, number> = {
    pawn: 100,
    knight: 320,
    bishop: 330,
    rook: 500,
    queen: 900,
    king: 20000,
    empty: 0
};

export const PAWN_PST = [
    [ 0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [ 5,  5, 10, 25, 25, 10,  5,  5],
    [ 0,  0,  0, 20, 20,  0,  0,  0],
    [ 5, -5,-10,  0,  0,-10, -5,  5],
    [ 5, 10, 10,-20,-20, 10, 10,  5],
    [ 0,  0,  0,  0,  0,  0,  0,  0]
];

export const KNIGHT_PST = [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50]
];

export const BISHOP_PST = [
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5, 10, 10,  5,  0,-10],
    [-10,  5,  5, 10, 10,  5,  5,-10],
    [-10,  0, 10, 10, 10, 10,  0,-10],
    [-10, 10, 10, 10, 10, 10, 10,-10],
    [-10,  5,  0,  0,  0,  0,  5,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20]
];

export const ROOK_PST = [
    [  0,  0,  0,  0,  0,  0,  0,  0],
    [  5, 10, 10, 10, 10, 10, 10,  5],
    [ -5,  0,  0,  0,  0,  0,  0, -5],
    [ -5,  0,  0,  0,  0,  0,  0, -5],
    [ -5,  0,  0,  0,  0,  0,  0, -5],
    [ -5,  0,  0,  0,  0,  0,  0, -5],
    [ -5,  0,  0,  0,  0,  0,  0, -5],
    [  0,  0,  0,  5,  5,  0,  0,  0]
];

export const QUEEN_PST = [
    [-20,-10,-10, -5, -5,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5,  5,  5,  5,  0,-10],
    [ -5,  0,  5,  5,  5,  5,  0, -5],
    [  0,  0,  5,  5,  5,  5,  0, -5],
    [-10,  5,  5,  5,  5,  5,  0,-10],
    [-10,  0,  5,  0,  0,  0,  0,-10],
    [-20,-10,-10, -5, -5,-10,-10,-20]
];

export const KING_PST_MID = [
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-20,-30,-30,-40,-40,-30,-30,-20],
    [-10,-20,-20,-20,-20,-20,-20,-10],
    [ 20, 20,  0,  0,  0,  0, 20, 20],
    [ 20, 30, 10,  0,  0, 10, 30, 20]
];

export const KING_PST_END = [
    [-50,-40,-30,-20,-20,-30,-40,-50],
    [-30,-20,-10,  0,  0,-10,-20,-30],
    [-30,-10, 20, 30, 30, 20,-10,-30],
    [-30,-10, 30, 40, 40, 30,-10,-30],
    [-30,-10, 30, 40, 40, 30,-10,-30],
    [-30,-10, 20, 30, 30, 20,-10,-30],
    [-30,-30,  0,  0,  0,  0,-30,-30],
    [-50,-30,-30,-30,-30,-30,-30,-50]
];

// 10 Calibrated Maia Chess & Stockfish Bot Profiles (100% Downloaded Local ONNX/WASM)
export const BOT_PROFILES: Record<string, BotProfile> = {
    bot_400:  { name: "Maia 1100 (Casual)", elo: 800,  maiaModel: "1100", temperature: 1.50, depth: 1, blunderRate: 0.35, noise: 60, bookDepth: 0,  minDelay: 600,  maxDelay: 1000 },
    bot_700:  { name: "Maia 1100 (Relaxed)", elo: 1000, maiaModel: "1100", temperature: 0.75, depth: 2, blunderRate: 0.15, noise: 30, bookDepth: 1,  minDelay: 700,  maxDelay: 1100 },
    bot_1000: { name: "Maia 1100", elo: 1100, maiaModel: "1100", temperature: 0.20, depth: 2, blunderRate: 0.08, noise: 18, bookDepth: 2,  minDelay: 800,  maxDelay: 1300 },
    bot_1300: { name: "Maia 1300", elo: 1300, maiaModel: "1300", temperature: 0.20, depth: 2, blunderRate: 0.05, noise: 10, bookDepth: 4,  minDelay: 900,  maxDelay: 1400 },
    bot_1600: { name: "Maia 1500", elo: 1500, maiaModel: "1500", temperature: 0.20, depth: 3, blunderRate: 0.02, noise: 5,  bookDepth: 6,  minDelay: 1000, maxDelay: 1600 },
    bot_1900: { name: "Maia 1700", elo: 1700, maiaModel: "1700", temperature: 0.18, depth: 3, blunderRate: 0.01, noise: 2,  bookDepth: 8,  minDelay: 1100, maxDelay: 1700 },
    bot_2200: { name: "Maia 1900", elo: 1900, maiaModel: "1900", temperature: 0.15, depth: 4, blunderRate: 0.00, noise: 1,  bookDepth: 10, minDelay: 1200, maxDelay: 1800 },
    bot_2500: { name: "Maia 1900 (Sharp)", elo: 2100, maiaModel: "1900", temperature: 0.01, depth: 4, blunderRate: 0.00, noise: 0,  bookDepth: 12, minDelay: 1300, maxDelay: 2000 },
    bot_2800: { name: "Stockfish Master", elo: 2600, maiaModel: "stockfish", temperature: 0.01, depth: 4, blunderRate: 0.00, noise: 0,  bookDepth: 14, minDelay: 1400, maxDelay: 2100 },
    bot_3000: { name: "Stockfish 3000", elo: 3000, maiaModel: "stockfish", temperature: 0.01, depth: 5, blunderRate: 0.00, noise: 0,  bookDepth: 16, minDelay: 1500, maxDelay: 2200 }
};

export class AIPlayer {
    public static getProfile(key: string): BotProfile {
        if (BOT_PROFILES[key]) return BOT_PROFILES[key];
        if (key === "easy") return BOT_PROFILES.bot_700;
        if (key === "medium") return BOT_PROFILES.bot_1600;
        if (key === "hard") return BOT_PROFILES.bot_2500;
        return BOT_PROFILES.bot_1600;
    }

    public static isSquareAttacked(boardState: Piece[][], targetI: number, targetJ: number, byColour: string): boolean {
        // 1. Pawn attacks
        const pawnRow = byColour === "w" ? targetI + 1 : targetI - 1;
        if (pawnRow >= 0 && pawnRow < 8) {
            for (const col of [targetJ - 1, targetJ + 1]) {
                if (col >= 0 && col < 8) {
                    const p = boardState[pawnRow][col];
                    if (p.name === "pawn" && p.colour === byColour) return true;
                }
            }
        }

        // 2. Knight attacks
        const knightOffsets = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        for (const [di, dj] of knightOffsets) {
            const ni = targetI + di;
            const nj = targetJ + dj;
            if (ni >= 0 && ni < 8 && nj >= 0 && nj < 8) {
                const p = boardState[ni][nj];
                if (p.name === "knight" && p.colour === byColour) return true;
            }
        }

        // 3. King attacks
        for (let di = -1; di <= 1; di++) {
            for (let dj = -1; dj <= 1; dj++) {
                if (di === 0 && dj === 0) continue;
                const ki = targetI + di;
                const kj = targetJ + dj;
                if (ki >= 0 && ki < 8 && kj >= 0 && kj < 8) {
                    const p = boardState[ki][kj];
                    if (p.name === "king" && p.colour === byColour) return true;
                }
            }
        }

        // 4. Straight line attacks (Rook & Queen)
        const straightDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [di, dj] of straightDirs) {
            let step = 1;
            while (true) {
                const ni = targetI + di * step;
                const nj = targetJ + dj * step;
                if (ni < 0 || ni >= 8 || nj < 0 || nj >= 8) break;
                const p = boardState[ni][nj];
                if (!(p instanceof EmptyPiece)) {
                    if (p.colour === byColour && (p.name === "rook" || p.name === "queen")) return true;
                    break;
                }
                step++;
            }
        }

        // 5. Diagonal attacks (Bishop & Queen)
        const diagDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        for (const [di, dj] of diagDirs) {
            let step = 1;
            while (true) {
                const ni = targetI + di * step;
                const nj = targetJ + dj * step;
                if (ni < 0 || ni >= 8 || nj < 0 || nj >= 8) break;
                const p = boardState[ni][nj];
                if (!(p instanceof EmptyPiece)) {
                    if (p.colour === byColour && (p.name === "bishop" || p.name === "queen")) return true;
                    break;
                }
                step++;
            }
        }

        return false;
    }

    public static evaluateBoard(boardState: Piece[][]): number {
        let whiteNonPawns = 0;
        let blackNonPawns = 0;
        let whiteBishops = 0;
        let blackBishops = 0;

        const whitePawnsPerCol = new Array(8).fill(0);
        const blackPawnsPerCol = new Array(8).fill(0);

        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = boardState[i][j];
                if (piece instanceof EmptyPiece) continue;
                const val = PIECE_VALUES[piece.name] || 0;
                if (piece.colour === "w") {
                    if (piece.name !== "pawn" && piece.name !== "king") whiteNonPawns += val;
                    if (piece.name === "bishop") whiteBishops++;
                    if (piece.name === "pawn") whitePawnsPerCol[j]++;
                } else {
                    if (piece.name !== "pawn" && piece.name !== "king") blackNonPawns += val;
                    if (piece.name === "bishop") blackBishops++;
                    if (piece.name === "pawn") blackPawnsPerCol[j]++;
                }
            }
        }

        const totalNonPawn = whiteNonPawns + blackNonPawns;
        const isEndgame = totalNonPawn < 2400;

        let score = 0;

        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = boardState[i][j];
                if (piece instanceof EmptyPiece) continue;

                const val = PIECE_VALUES[piece.name] || 0;
                let positional = 0;
                const row = piece.colour === "w" ? i : 7 - i;
                const col = piece.colour === "w" ? j : 7 - j;

                if (piece.name === "pawn") {
                    positional = PAWN_PST[row][col];
                } else if (piece.name === "knight") {
                    positional = KNIGHT_PST[row][col];
                } else if (piece.name === "bishop") {
                    positional = BISHOP_PST[row][col];
                } else if (piece.name === "rook") {
                    positional = ROOK_PST[row][col];
                    const pawnsOnMyCol = piece.colour === "w" ? whitePawnsPerCol[j] : blackPawnsPerCol[j];
                    const oppPawnsOnCol = piece.colour === "w" ? blackPawnsPerCol[j] : whitePawnsPerCol[j];
                    if (pawnsOnMyCol === 0) {
                        positional += (oppPawnsOnCol === 0) ? 25 : 15;
                    }
                } else if (piece.name === "queen") {
                    positional = QUEEN_PST[row][col];
                } else if (piece.name === "king") {
                    positional = isEndgame ? KING_PST_END[row][col] : KING_PST_MID[row][col];
                }

                const totalVal = val + positional;
                if (piece.colour === "w") {
                    score += totalVal;
                } else {
                    score -= totalVal;
                }
            }
        }

        if (whiteBishops >= 2) score += 40;
        if (blackBishops >= 2) score -= 40;

        for (let col = 0; col < 8; col++) {
            if (whitePawnsPerCol[col] > 1) score -= (whitePawnsPerCol[col] - 1) * 18;
            if (blackPawnsPerCol[col] > 1) score += (blackPawnsPerCol[col] - 1) * 18;
        }

        return score;
    }

    public static getAllLegalMoves(game: ChessGame, colour: string): MoveOption[] {
        const moves: MoveOption[] = [];
        const pieces = game.getPieces();

        for (let p = 0; p < pieces.length; p++) {
            const piece = pieces[p];
            if (piece instanceof EmptyPiece || piece.colour !== colour) continue;

            for (let m = 0; m < piece.possibleMoves.length; m++) {
                moves.push({
                    piece,
                    destination: piece.possibleMoves[m]
                });
            }
        }

        moves.sort((a, b) => {
            const targetA = game.boardState[a.destination.i][a.destination.j];
            const targetB = game.boardState[b.destination.i][b.destination.j];
            const valA = targetA instanceof EmptyPiece ? 0 : (PIECE_VALUES[targetA.name] || 0);
            const valB = targetB instanceof EmptyPiece ? 0 : (PIECE_VALUES[targetB.name] || 0);
            return valB - valA;
        });

        return moves;
    }

    public static tryBookMove(game: ChessGame, colour: string, maxBookPlies: number): MoveOption | null {
        if (!game.moveHistory || game.moveHistory.length >= maxBookPlies) return null;

        const bookSan = getBookMove(game.moveHistory);
        if (!bookSan) return null;

        const pieces = game.getPieces();
        for (const piece of pieces) {
            if (piece.colour !== colour || piece instanceof EmptyPiece) continue;
            for (const dest of piece.possibleMoves) {
                const isCapture = !(game.boardState[dest.i][dest.j] instanceof EmptyPiece) ||
                                  (piece.name === "pawn" && piece.j !== dest.j);
                const isCastleKingside = piece.name === "king" && (dest.j - piece.j === 2);
                const isCastleQueenside = piece.name === "king" && (piece.j - dest.j === 2);

                const san = generateAlgebraicNotation({
                    piece,
                    from: { i: piece.i, j: piece.j },
                    to: dest,
                    isCapture,
                    isCheck: false,
                    isCheckmate: false,
                    isCastleKingside,
                    isCastleQueenside
                });

                const cleanSan = san.replace(/[+#=?!]/g, "").trim();
                const targetSan = bookSan.replace(/[+#=?!]/g, "").trim();

                if (cleanSan === targetSan) {
                    return { piece, destination: dest };
                }
            }
        }

        return null;
    }

    public static alphaBeta(game: ChessGame, depth: number, alpha: number, beta: number, isMaximizing: boolean, turnColour: string, enemyColour: string): number {
        if (depth === 0) {
            return this.evaluateBoard(game.boardState);
        }

        const legalMoves = this.getAllLegalMoves(game, turnColour);
        if (legalMoves.length === 0) {
            const king = game.getKingOfColour(turnColour);
            if (king && king.threatened) {
                return isMaximizing ? -15000 - depth : 15000 + depth;
            }
            return 0;
        }

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (const move of legalMoves) {
                const sI = move.piece.i, sJ = move.piece.j;
                const dI = move.destination.i, dJ = move.destination.j;
                const cap = game.boardState[dI][dJ];
                const dummy = new EmptyPiece(game, sI, sJ);

                game.boardState[dI][dJ] = move.piece;
                game.boardState[sI][sJ] = dummy;
                move.piece.i = dI; move.piece.j = dJ;

                const evaluation = this.alphaBeta(game, depth - 1, alpha, beta, false, enemyColour, turnColour);

                game.boardState[sI][sJ] = move.piece;
                game.boardState[dI][dJ] = cap;
                move.piece.i = sI; move.piece.j = sJ;

                maxEval = Math.max(maxEval, evaluation);
                alpha = Math.max(alpha, evaluation);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of legalMoves) {
                const sI = move.piece.i, sJ = move.piece.j;
                const dI = move.destination.i, dJ = move.destination.j;
                const cap = game.boardState[dI][dJ];
                const dummy = new EmptyPiece(game, sI, sJ);

                game.boardState[dI][dJ] = move.piece;
                game.boardState[sI][sJ] = dummy;
                move.piece.i = dI; move.piece.j = dJ;

                const evaluation = this.alphaBeta(game, depth - 1, alpha, beta, true, enemyColour, turnColour);

                game.boardState[sI][sJ] = move.piece;
                game.boardState[dI][dJ] = cap;
                move.piece.i = sI; move.piece.j = sJ;

                minEval = Math.min(minEval, evaluation);
                beta = Math.min(beta, evaluation);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }

    public static findBestMove(game: ChessGame, aiColour: string, botKey = "bot_1600"): MoveOption | null {
        const legalMoves = this.getAllLegalMoves(game, aiColour);
        if (legalMoves.length === 0) return null;

        const profile = this.getProfile(botKey);

        if (profile.bookDepth > 0) {
            const bookMove = this.tryBookMove(game, aiColour, profile.bookDepth);
            if (bookMove) {
                return bookMove;
            }
        }

        if (profile.blunderRate > 0 && Math.random() < profile.blunderRate) {
            return legalMoves[Math.floor(Math.random() * legalMoves.length)];
        }

        const isWhite = aiColour === "w";
        const enemyColour = isWhite ? "b" : "w";

        if (profile.depth <= 1) {
            let bestMove = legalMoves[0];
            let bestScore = -Infinity;

            for (const move of legalMoves) {
                const target = game.boardState[move.destination.i][move.destination.j];
                const captureVal = target instanceof EmptyPiece ? 0 : (PIECE_VALUES[target.name] || 0);
                const noise = profile.noise > 0 ? (Math.random() * (profile.noise * 2) - profile.noise) : 0;
                const score = captureVal + noise;
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
            }
            return bestMove;
        }

        let bestMove = legalMoves[0];
        let bestScore = -Infinity;
        let alpha = -Infinity;
        const beta = Infinity;

        const searchDepth = Math.max(1, profile.depth - 1);

        for (const move of legalMoves) {
            const sI = move.piece.i, sJ = move.piece.j;
            const dI = move.destination.i, dJ = move.destination.j;
            const cap = game.boardState[dI][dJ];
            const dummy = new EmptyPiece(game, sI, sJ);

            game.boardState[dI][dJ] = move.piece;
            game.boardState[sI][sJ] = dummy;
            move.piece.i = dI; move.piece.j = dJ;

            const evalScore = this.alphaBeta(game, searchDepth, alpha, beta, !isWhite, enemyColour, aiColour);
            let moveVal = isWhite ? evalScore : -evalScore;

            if (profile.noise > 0) {
                moveVal += (Math.random() * (profile.noise * 2) - profile.noise);
            }

            game.boardState[sI][sJ] = move.piece;
            game.boardState[dI][dJ] = cap;
            move.piece.i = sI; move.piece.j = sJ;

            if (moveVal > bestScore) {
                bestScore = moveVal;
                bestMove = move;
            }

            alpha = Math.max(alpha, isWhite ? moveVal : -moveVal);
        }

        return bestMove;
    }

    public static async findBestMoveAsync(game: ChessGame, aiColour: string, botKey = "bot_1600", forceDeterministic = false): Promise<MoveOption | null> {
        const profile = this.getProfile(botKey);
        const temp = forceDeterministic ? 0.01 : (profile.temperature !== undefined ? profile.temperature : 0.2);
        try {
            const maiaMove = await maiaEngine.predictMove(
                game,
                profile.maiaModel || "1500",
                temp
            );
            if (maiaMove && maiaMove.piece && maiaMove.destination) {
                return maiaMove;
            }
        } catch (err) {
            console.warn("Maia engine fallback to local search:", err);
        }
        return this.findBestMove(game, aiColour, botKey);
    }
}
