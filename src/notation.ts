import { BoardPosition } from "./board_position.js";
import { Piece } from "./piece.js";

export interface MoveNotationDetails {
    from: BoardPosition;
    to: BoardPosition;
    piece: Piece;
    isCapture: boolean;
    isCheck: boolean;
    isCheckmate: boolean;
    isCastleKingside?: boolean;
    isCastleQueenside?: boolean;
    promotion?: string;
}

export function positionToSquare(pos: BoardPosition): string {
    const file = String.fromCharCode(97 + pos.j);
    const rank = (8 - pos.i).toString();
    return `${file}${rank}`;
}

export function generateAlgebraicNotation(details: MoveNotationDetails): string {
    if (details.isCastleKingside) {
        let note = "O-O";
        if (details.isCheckmate) note += "#";
        else if (details.isCheck) note += "+";
        return note;
    }
    if (details.isCastleQueenside) {
        let note = "O-O-O";
        if (details.isCheckmate) note += "#";
        else if (details.isCheck) note += "+";
        return note;
    }

    const pieceName = details.piece.name;
    const destSquare = positionToSquare(details.to);
    const fromFile = String.fromCharCode(97 + details.from.j);

    let prefix = "";
    switch (pieceName) {
        case "knight": prefix = "N"; break;
        case "bishop": prefix = "B"; break;
        case "rook": prefix = "R"; break;
        case "queen": prefix = "Q"; break;
        case "king": prefix = "K"; break;
        default: prefix = ""; break;
    }

    let san = "";
    if (pieceName === "pawn") {
        if (details.isCapture) {
            san = `${fromFile}x${destSquare}`;
        } else {
            san = destSquare;
        }
        if (details.promotion) {
            const promoLetter = details.promotion[0].toUpperCase();
            san += `=${promoLetter}`;
        }
    } else {
        if (details.isCapture) {
            san = `${prefix}x${destSquare}`;
        } else {
            san = `${prefix}${destSquare}`;
        }
    }

    if (details.isCheckmate) {
        san += "#";
    } else if (details.isCheck) {
        san += "+";
    }

    return san;
}
