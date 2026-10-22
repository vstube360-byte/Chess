export interface OpeningDef {
    moves: string[];
    name: string;
}

export const OPENINGS: OpeningDef[] = [
    // Open Game (1. e4 e5)
    { moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5"], name: "Italian Game: Giuoco Piano" },
    { moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6"], name: "Italian Game: Two Knights Defense" },
    { moves: ["e4", "e5", "Nf3", "Nc6", "Bc4"], name: "Italian Game" },
    { moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6"], name: "Ruy Lopez: Morphy Defense" },
    { moves: ["e4", "e5", "Nf3", "Nc6", "Bb5"], name: "Ruy Lopez" },
    { moves: ["e4", "e5", "Nf3", "Nc6", "d4"], name: "Scotch Game" },
    { moves: ["e4", "e5", "Nf3", "Nf6"], name: "Petrov's Defense" },
    { moves: ["e4", "e5", "Nc3"], name: "Vienna Game" },
    { moves: ["e4", "e5", "f4"], name: "King's Gambit" },
    { moves: ["e4", "e5"], name: "Open Game" },

    // Sicilian Defense (1. e4 c5)
    { moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6"], name: "Sicilian: Najdorf Variation" },
    { moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "g6"], name: "Sicilian: Dragon Variation" },
    { moves: ["e4", "c5", "Nf3", "e6", "d4", "cxd4", "Nxd4", "a6"], name: "Sicilian: Kan Variation" },
    { moves: ["e4", "c5", "Nf3", "Nc6"], name: "Sicilian: Old Sicilian" },
    { moves: ["e4", "c5", "Nf3", "d6"], name: "Sicilian: Open Sicilian" },
    { moves: ["e4", "c5", "c3"], name: "Sicilian: Alapin Variation" },
    { moves: ["e4", "c5", "Nc3"], name: "Sicilian: Closed Sicilian" },
    { moves: ["e4", "c5"], name: "Sicilian Defense" },

    // French Defense (1. e4 e6)
    { moves: ["e4", "e6", "d4", "d5", "Nc3", "Nf6"], name: "French: Classical Variation" },
    { moves: ["e4", "e6", "d4", "d5", "e5"], name: "French: Advance Variation" },
    { moves: ["e4", "e6", "d4", "d5", "exd5"], name: "French: Exchange Variation" },
    { moves: ["e4", "e6", "d4", "d5"], name: "French Defense" },
    { moves: ["e4", "e6"], name: "French Defense" },

    // Caro-Kann (1. e4 c6)
    { moves: ["e4", "c6", "d4", "d5", "e5"], name: "Caro-Kann: Advance Variation" },
    { moves: ["e4", "c6", "d4", "d5", "Nc3"], name: "Caro-Kann: Classical Variation" },
    { moves: ["e4", "c6", "d4", "d5"], name: "Caro-Kann Defense" },
    { moves: ["e4", "c6"], name: "Caro-Kann Defense" },

    // Other 1. e4
    { moves: ["e4", "d5", "exd5", "Qxd5"], name: "Scandinavian: Main Line" },
    { moves: ["e4", "d5"], name: "Scandinavian Defense" },
    { moves: ["e4", "d6", "d4", "Nf6"], name: "Pirc Defense" },
    { moves: ["e4", "d6"], name: "Pirc Defense" },
    { moves: ["e4", "g6"], name: "Modern Defense" },
    { moves: ["e4", "Nf6"], name: "Alekhine's Defense" },

    // Queen's Pawn Game (1. d4 d5)
    { moves: ["d4", "d5", "c4", "e6", "Nc3", "Nf6"], name: "Queen's Gambit Declined" },
    { moves: ["d4", "d5", "c4", "e6"], name: "Queen's Gambit Declined" },
    { moves: ["d4", "d5", "c4", "dxc4"], name: "Queen's Gambit Accepted" },
    { moves: ["d4", "d5", "c4", "c6"], name: "Slav Defense" },
    { moves: ["d4", "d5", "c4"], name: "Queen's Gambit" },
    { moves: ["d4", "d5", "Nf3", "Nf6", "Bf4"], name: "London System" },
    { moves: ["d4", "d5", "Bf4"], name: "London System" },
    { moves: ["d4", "d5"], name: "Queen's Pawn Game" },

    // Indian Defenses (1. d4 Nf6)
    { moves: ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4"], name: "Nimzo-Indian Defense" },
    { moves: ["d4", "Nf6", "c4", "e6", "Nf3", "b6"], name: "Queen's Indian Defense" },
    { moves: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7"], name: "King's Indian Defense" },
    { moves: ["d4", "Nf6", "c4", "g6"], name: "King's Indian Defense" },
    { moves: ["d4", "Nf6", "c4", "c5"], name: "Benoni Defense" },
    { moves: ["d4", "Nf6", "c4", "e5"], name: "Budapest Gambit" },
    { moves: ["d4", "Nf6", "c4"], name: "Indian Defense" },
    { moves: ["d4", "Nf6"], name: "Indian Defense" },

    // Flank Openings
    { moves: ["c4", "e5"], name: "English: King's English" },
    { moves: ["c4", "c5"], name: "English: Symmetrical" },
    { moves: ["c4"], name: "English Opening" },
    { moves: ["Nf3", "d5", "g3"], name: "King's Indian Attack" },
    { moves: ["Nf3"], name: "Réti Opening" },
    { moves: ["f4", "d5"], name: "Bird's Opening" },
    { moves: ["f4"], name: "Bird's Opening" },
    { moves: ["b3"], name: "Nimzo-Larsen Attack" }
];

export function detectOpening(moveHistory: string[]): string | null {
    if (!moveHistory || moveHistory.length === 0) return null;

    // Normalize moves by removing trailing +, #, =, etc.
    const cleanMoves = moveHistory.map(m => m.replace(/[+#=?!]/g, "").trim());

    let bestMatch: OpeningDef | null = null;
    let maxMatchLen = 0;

    for (const opening of OPENINGS) {
        if (opening.moves.length <= cleanMoves.length) {
            let matches = true;
            for (let i = 0; i < opening.moves.length; i++) {
                if (opening.moves[i] !== cleanMoves[i]) {
                    matches = false;
                    break;
                }
            }
            if (matches && opening.moves.length > maxMatchLen) {
                maxMatchLen = opening.moves.length;
                bestMatch = opening;
            }
        }
    }

    return bestMatch ? bestMatch.name : null;
}

export function getBookMove(moveHistory: string[]): string | null {
    const cleanMoves = (moveHistory || []).map(m => m.replace(/[+#=?!]/g, "").trim());
    const nextIndex = cleanMoves.length;

    const candidateNextMoves: string[] = [];
    for (const opening of OPENINGS) {
        if (opening.moves.length > nextIndex) {
            let matches = true;
            for (let i = 0; i < nextIndex; i++) {
                if (opening.moves[i] !== cleanMoves[i]) {
                    matches = false;
                    break;
                }
            }
            if (matches) {
                candidateNextMoves.push(opening.moves[nextIndex]);
            }
        }
    }

    if (candidateNextMoves.length === 0) return null;
    return candidateNextMoves[Math.floor(Math.random() * candidateNextMoves.length)];
}
