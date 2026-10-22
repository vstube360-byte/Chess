import { WebChessGame } from "./web_chess_game.js";
import { ChessGame } from "./chess_game.js";
import { BoardPosition } from "./board_position.js";
import { Piece } from "./piece.js";
import { EmptyPiece } from "./pieces/empty_piece.js";
import { King } from "./pieces/king.js";

export class BoardElement {
    public boardContainer: HTMLElement;
    public grid: HTMLElement[][] = [];
    public game: ChessGame;
    public parent: WebChessGame;
    public isFlipped: boolean = false;
    public tableMode: boolean = false;

    // Drag-and-drop state
    private activePointerId: number | null = null;
    private dragStartTile: { i: number; j: number } | null = null;
    private dragStartPos: { x: number; y: number } | null = null;
    private isDragging: boolean = false;
    private dragGhost: HTMLElement | null = null;
    public justDragged: boolean = false;

    // Static listener registration
    private static globalListenersAttached: boolean = false;
    private static activeInstance: BoardElement | null = null;

    constructor(parent: WebChessGame, boardContainer: HTMLElement, game: ChessGame) {
        this.parent = parent;
        this.boardContainer = boardContainer;
        this.game = game;
        BoardElement.activeInstance = this;

        this.paintTiles();
        this.repaint();
        this.setupGlobalPointerListeners();
    }

    private setupGlobalPointerListeners(): void {
        BoardElement.activeInstance = this;
        if (BoardElement.globalListenersAttached) return;
        BoardElement.globalListenersAttached = true;

        window.addEventListener("pointermove", (e: PointerEvent) => {
            const instance = BoardElement.activeInstance;
            if (!instance || instance.activePointerId !== e.pointerId) return;
            instance.handlePointerMove(e);
        }, { passive: false });

        const endDrag = (e: PointerEvent) => {
            const instance = BoardElement.activeInstance;
            if (!instance || instance.activePointerId !== e.pointerId) return;
            instance.handlePointerUp(e);
        };

        window.addEventListener("pointerup", endDrag);
        window.addEventListener("pointercancel", endDrag);
    }

    private handlePointerMove(e: PointerEvent): void {
        if (!this.dragStartPos || !this.dragStartTile) return;

        const dx = e.clientX - this.dragStartPos.x;
        const dy = e.clientY - this.dragStartPos.y;

        if (!this.isDragging && Math.hypot(dx, dy) > 8) {
            const startPiece = this.game.boardState[this.dragStartTile.i][this.dragStartTile.j];
            if (startPiece && !(startPiece instanceof EmptyPiece) && startPiece.colour === this.game.getTurnPlayer()) {
                this.isDragging = true;

                // Ensure selected
                if (!this.game.moveTracker.active || this.game.moveTracker.activePiece !== startPiece) {
                    this.parent.processSelection(new BoardPosition(this.dragStartTile.i, this.dragStartTile.j));
                }

                // Create ghost element
                const origTile = this.grid[this.dragStartTile.i][this.dragStartTile.j];
                const pieceImg = origTile.querySelector(".chess-piece") as HTMLImageElement | null;
                const rect = origTile.getBoundingClientRect();

                this.dragGhost = document.createElement("img");
                (this.dragGhost as HTMLImageElement).src = pieceImg ? pieceImg.src : `assets/${this.getImageFilename(startPiece)}.png`;
                this.dragGhost.className = "chess-piece dragging-piece";
                this.dragGhost.style.width = `${rect.width}px`;
                this.dragGhost.style.height = `${rect.height}px`;

                if (this.tableMode && startPiece.colour === "b") {
                    this.dragGhost.style.transform = "rotate(180deg)";
                }

                document.body.appendChild(this.dragGhost);

                if (pieceImg) {
                    pieceImg.style.opacity = "0.2";
                }
            }
        }

        if (this.isDragging && this.dragGhost) {
            const rect = this.dragGhost.getBoundingClientRect();
            this.dragGhost.style.left = `${e.clientX - rect.width / 2}px`;
            this.dragGhost.style.top = `${e.clientY - rect.height / 2}px`;
        }
    }

    private handlePointerUp(e: PointerEvent): void {
        if (this.isDragging && this.dragGhost && this.dragStartTile) {
            this.dragGhost.style.display = "none";
            const elUnder = document.elementFromPoint(e.clientX, e.clientY);
            const targetTile = elUnder ? elUnder.closest(".boardtile") as HTMLElement | null : null;

            if (targetTile && targetTile.dataset.row !== undefined && targetTile.dataset.col !== undefined) {
                const targetI = parseInt(targetTile.dataset.row, 10);
                const targetJ = parseInt(targetTile.dataset.col, 10);

                if (targetI !== this.dragStartTile.i || targetJ !== this.dragStartTile.j) {
                    this.parent.processSelection(new BoardPosition(targetI, targetJ));
                }
            }

            this.dragGhost.remove();
            this.dragGhost = null;
            this.isDragging = false;
            this.justDragged = true;
            setTimeout(() => { this.justDragged = false; }, 60);
            this.repaint();
        }

        this.activePointerId = null;
        this.dragStartTile = null;
        this.dragStartPos = null;
    }

    setFlipped(flipped: boolean): void {
        this.isFlipped = flipped;
        this.rebuildBoard();
    }

    setTableMode(enabled: boolean): void {
        this.tableMode = enabled;
        if (enabled) {
            this.boardContainer.classList.add("table-mode");
        } else {
            this.boardContainer.classList.remove("table-mode");
        }
        this.repaint();
    }

    rebuildBoard(): void {
        BoardElement.activeInstance = this;
        this.paintTiles();
        this.repaint();
    }

    repaint(previewSnapshot: any = null): void {
        if (previewSnapshot) {
            this.clearPreviousBoard(true);
            this.paintLastMoveHighlights(previewSnapshot.lastMoves);
            this.paintSnapshotBoard(previewSnapshot.board);
            return;
        }
        this.clearPreviousBoard(false);
        this.paintLastMoveHighlights(this.game.lastMoves);
        this.paintPieces(this.game.getPieces());
    }

    paintSnapshotBoard(board: any): void {
        if (!board) return;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const cell = board[i]?.[j];
                if (!cell || cell.name === "empty") continue;
                const tile = this.grid[i]?.[j];
                if (!tile) continue;
                const img = document.createElement("img");
                img.classList.add("chess-piece");
                img.src = `assets/${cell.name}_${cell.colour}.png`;
                tile.appendChild(img);
            }
        }
    }

    clearPreviousBoard(skipCaptureFade: boolean = false): void {
        document.querySelectorAll(".highlighted").forEach(el => el.classList.remove("highlighted"));
        document.querySelectorAll(".markerdot").forEach(el => el.remove());
        document.querySelectorAll(".markercircle").forEach(el => el.remove());
        document.querySelectorAll(".last-move").forEach(el => el.classList.remove("last-move"));
        document.querySelectorAll(".hint-tile").forEach(el => el.classList.remove("hint-tile"));
        document.querySelectorAll(".fading-piece").forEach(el => el.remove());

        let capturedPos: BoardPosition | null = null;
        if (!skipCaptureFade && this.game.lastMoves) {
            const unhandledMove = this.game.lastMoves.find(m => !m.animated && m.captured);
            if (unhandledMove && unhandledMove.captured) {
                capturedPos = unhandledMove.captured.position;
            }
        }

        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const tile = this.grid[i]?.[j];
                if (!tile) continue;
                const pieceImg = tile.querySelector(".chess-piece") as HTMLImageElement | null;
                if (!pieceImg) continue;

                if (capturedPos && capturedPos.i === i && capturedPos.j === j) {
                    pieceImg.classList.remove("chess-piece");
                    pieceImg.classList.add("fading-piece");
                    const isRotated = this.tableMode && pieceImg.src.includes("_b");
                    const fadeAnim = pieceImg.animate([
                        { opacity: "1", transform: isRotated ? "rotate(180deg) scale(1)" : "scale(1)" },
                        { opacity: "0", transform: isRotated ? "rotate(180deg) scale(0.65)" : "scale(0.65)" }
                    ], {
                        duration: 180,
                        easing: "ease-out",
                        fill: "forwards"
                    });
                    fadeAnim.onfinish = () => {
                        pieceImg.remove();
                    };
                } else {
                    pieceImg.remove();
                }
            }
        }
    }

    paintLastMoveHighlights(moves: any = this.game.lastMoves): void {
        if (moves && moves.length > 0) {
            const primaryMove = moves[0];
            const fromTile = this.grid[primaryMove.from.i]?.[primaryMove.from.j];
            const toTile = this.grid[primaryMove.to.i]?.[primaryMove.to.j];
            if (fromTile) fromTile.classList.add("last-move");
            if (toTile) toTile.classList.add("last-move");
        }
    }

    paintPieces(pieces: Piece[]): void {
        pieces.forEach((piece) => {
            this.paintPiece(piece);
        });
    }

    paintPiece(piece: Piece): void {
        if (piece instanceof EmptyPiece) {
            return;
        }

        const tile = this.grid[piece.i]?.[piece.j];
        if (!tile) return;
        const img = this.createImageElement(piece);
        tile.appendChild(img);

        if (this.game.lastMoves) {
            const move = this.game.lastMoves.find(
                m => !m.animated && m.to.i === piece.i && m.to.j === piece.j
            );
            if (move) {
                move.animated = true;
                this.animatePieceMove(img, move.from, move.to, piece.colour);
            }
        }
    }

    animatePieceMove(img: HTMLImageElement, from: BoardPosition, to: BoardPosition, colour: string): void {
        const fromTile = this.grid[from.i]?.[from.j];
        const toTile = this.grid[to.i]?.[to.j];
        if (!fromTile || !toTile) return;

        const fromRect = fromTile.getBoundingClientRect();
        const toRect = toTile.getBoundingClientRect();

        const deltaX = fromRect.left - toRect.left;
        const deltaY = fromRect.top - toRect.top;

        if (deltaX === 0 && deltaY === 0) {
            return;
        }

        const isRotated = this.tableMode && colour === "b";
        const startTransform = isRotated
            ? `translate(${deltaX}px, ${deltaY}px) rotate(180deg)`
            : `translate(${deltaX}px, ${deltaY}px)`;
        const endTransform = isRotated
            ? `translate(0px, 0px) rotate(180deg)`
            : `translate(0px, 0px)`;

        img.style.zIndex = "100";
        const anim = img.animate([
            { transform: startTransform },
            { transform: endTransform }
        ], {
            duration: 220,
            easing: "cubic-bezier(0.2, 0, 0, 1)"
        });

        anim.onfinish = () => {
            img.style.zIndex = "";
        };
    }

    createImageElement(piece: Piece): HTMLImageElement {
        const img_name = this.getImageFilename(piece);

        const img = document.createElement("img");
        img.classList.add("chess-piece");
        img.src = `assets/${img_name}.png`;

        return img;
    }

    getImageFilename(piece: Piece): string {
        let img_name = `${piece.name}_${piece.colour}`;

        if (piece instanceof King) {
            const kingPiece = piece as King;
            if (kingPiece.threatened) {
                img_name += `_check`;
            }
        }

        return img_name;
    }

    paintTiles(): void {
        this.boardContainer.innerHTML = "";
        this.grid = [];
        for (let i = 0; i < 8; i++) {
            this.grid.push(new Array<HTMLElement>(8));
        }

        const rows = this.isFlipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
        const cols = this.isFlipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

        for (let r = 0; r < 8; r++) {
            const i = rows[r];
            for (let c = 0; c < 8; c++) {
                const j = cols[c];
                const paint = (i + j) % 2 === 0 ? "whitebg" : "blackbg";
                const tile = this.createTile(paint, i, j);

                // Add coordinates
                // Rank numbers on leftmost column (c === 0)
                if (c === 0) {
                    const rankLabel = document.createElement("span");
                    rankLabel.className = "coord coord-rank";
                    rankLabel.textContent = `${8 - i}`;
                    tile.appendChild(rankLabel);
                }
                // File letters on bottommost row (r === 7)
                if (r === 7) {
                    const fileLabel = document.createElement("span");
                    fileLabel.className = "coord coord-file";
                    fileLabel.textContent = String.fromCharCode(97 + j);
                    tile.appendChild(fileLabel);
                }

                this.grid[i][j] = tile;
                this.boardContainer.appendChild(tile);
            }
        }
    }

    createTile(paint: string, i: number, j: number): HTMLElement {
        const tile: HTMLElement = document.createElement("div");
        tile.classList.add("boardtile");
        tile.classList.add(paint);
        tile.dataset.row = i.toString();
        tile.dataset.col = j.toString();

        tile.addEventListener("pointerdown", (e: PointerEvent) => {
            if (this.parent.isAITurn() || (this.parent.isViewingHistory && this.parent.isViewingHistory())) return;
            this.activePointerId = e.pointerId;
            this.dragStartTile = { i, j };
            this.dragStartPos = { x: e.clientX, y: e.clientY };
            this.isDragging = false;
        });

        tile.addEventListener("click", () => {
            if (this.justDragged) return;
            const position = new BoardPosition(i, j);
            this.parent.processSelection(position);
        });

        return tile;
    }

    highlightActivePiece(piece: Piece): void {
        const tile = this.grid[piece.i]?.[piece.j];
        if (tile) {
            tile.classList.add("highlighted");
        }
        this.paintMoveOptions(piece.possibleMoves, piece);
    }

    showHint(from: BoardPosition, to: BoardPosition): void {
        document.querySelectorAll(".hint-tile").forEach(el => el.classList.remove("hint-tile"));
        const fromTile = this.grid[from.i]?.[from.j];
        const toTile = this.grid[to.i]?.[to.j];
        if (fromTile) fromTile.classList.add("hint-tile");
        if (toTile) toTile.classList.add("hint-tile");
    }

    paintMoveOptions(options: BoardPosition[], activePiece: Piece | null = null): void {
        options.forEach((position) => {
            this.illustrateMoveOption(position, activePiece);
        });
    }

    illustrateMoveOption(position: BoardPosition, activePiece: Piece | null = null): void {
        const piece: Piece = this.game.boardState[position.i][position.j];
        const isEnPassant = activePiece && activePiece.name === "pawn" && activePiece.j !== position.j && (piece instanceof EmptyPiece);
        if (piece instanceof EmptyPiece && !isEnPassant) {
            this.addDot(position.i, position.j);
        } else {
            this.addCircle(position.i, position.j);
        }
    }

    addDot(i: number, j: number): void {
        const tile = this.grid[i]?.[j];
        if (!tile) return;
        const dot = document.createElement("div");
        dot.classList.add("markerdot");
        tile.appendChild(dot);
    }

    addCircle(i: number, j: number): void {
        const tile = this.grid[i]?.[j];
        if (!tile) return;
        const circle = document.createElement("div");
        circle.classList.add("markercircle");
        tile.appendChild(circle);
    }
}