import { ChessGame, GameSnapshot } from "./chess_game.js";
import { BoardPosition } from "./board_position.js";
import { Piece } from "./piece.js";
import { BoardElement } from "./board_element.js";
import { EndCard } from "./end_card.js";
import { PromotionCard } from "./promotion_card.js";
import { SoundManager } from "./sound_effects.js";
import { ChessClock } from "./chess_clock.js";
import { AIPlayer } from "./ai_player.js";
import { detectOpening } from "./opening_book.js";

export type MoveQuality = "best" | "good" | "inaccuracy" | "mistake" | "blunder";

export interface MoveQualityRecord {
    move: string;
    quality: MoveQuality;
}

export class WebChessGame {
    public boardContainer: HTMLElement;
    public game: ChessGame;
    public boardElement: BoardElement;
    public soundManager: SoundManager;
    public clock: ChessClock;
    public gameMode: "pass_and_play" | "vs_bot_white" | "vs_bot_black" = "pass_and_play";
    public aiDifficulty: string = "bot_1600";
    public autoFlip: boolean = true;
    public aiThinking: boolean = false;

    // Undo / Redo stacks
    public undoStack: GameSnapshot[] = [];
    public redoStack: GameSnapshot[] = [];

    // Evaluation & Move Quality
    public lastEvalScore: number = 0;
    public moveQualities: MoveQualityRecord[] = [];

    // Current Theme
    public currentTheme: string = "wood";

    constructor(boardContainer: HTMLElement) {
        this.boardContainer = boardContainer;
        this.soundManager = new SoundManager();
        this.clock = new ChessClock(600);
        this.game = new ChessGame();
        this.boardElement = new BoardElement(this, this.boardContainer, this.game);

        this.loadSavedTheme();
        this.setupClockHandlers();
        this.bindDOMControls();

        // Try restoring auto-saved game if available
        if (!this.tryRestoreAutoSavedGame()) {
            this.refresh();
        }
    }

    private loadSavedTheme(): void {
        const savedTheme = localStorage.getItem("chess_board_theme") || "wood";
        this.setTheme(savedTheme);
    }

    public setTheme(theme: string): void {
        this.currentTheme = theme;
        localStorage.setItem("chess_board_theme", theme);
        this.boardContainer.setAttribute("data-theme", theme);
        const selectTheme = document.getElementById("select-theme") as HTMLSelectElement | null;
        if (selectTheme) {
            selectTheme.value = theme;
        }
    }

    private tryRestoreAutoSavedGame(): boolean {
        try {
            const saved = localStorage.getItem("chess_autosave");
            if (!saved) return false;

            const snapshot: GameSnapshot = JSON.parse(saved);
            if (snapshot && snapshot.board && snapshot.moveHistory && snapshot.moveHistory.length > 0 && snapshot.state === "ongoing") {
                this.game.restoreSnapshot(snapshot);
                if (snapshot.whiteTime !== undefined && snapshot.blackTime !== undefined) {
                    this.clock.whiteTime = snapshot.whiteTime;
                    this.clock.blackTime = snapshot.blackTime;
                }
                this.updateUndoRedoButtons();
                this.refresh();
                return true;
            }
        } catch (e) {
            console.warn("Could not restore autosaved game:", e);
        }
        return false;
    }

    private saveAutoSave(): void {
        try {
            if (this.game.state === "ongoing" && this.game.moveHistory.length > 0) {
                const snapshot = this.game.createSnapshot(this.clock.whiteTime, this.clock.blackTime, this.lastEvalScore);
                localStorage.setItem("chess_autosave", JSON.stringify(snapshot));
            } else {
                localStorage.removeItem("chess_autosave");
            }
        } catch (e) {
            // LocalStorage might be disabled or full in private mode
        }
    }

    private setupClockHandlers(): void {
        this.clock.onTick = (whiteTime, blackTime, activePlayer) => {
            const isFlipped = this.boardElement.isFlipped;
            const topTime = isFlipped ? whiteTime : blackTime;
            const bottomTime = isFlipped ? blackTime : whiteTime;
            const topPlayer = isFlipped ? "w" : "b";
            const bottomPlayer = isFlipped ? "b" : "w";

            const topClockEl = document.getElementById("clock-top");
            const bottomClockEl = document.getElementById("clock-bottom");

            if (topClockEl) {
                topClockEl.innerText = ChessClock.formatTime(topTime);
                if (topTime <= 30 && topTime > 0) topClockEl.classList.add("low-time");
                else topClockEl.classList.remove("low-time");

                if (activePlayer === topPlayer && this.clock.isRunning) topClockEl.classList.add("active-clock");
                else topClockEl.classList.remove("active-clock");
            }

            if (bottomClockEl) {
                bottomClockEl.innerText = ChessClock.formatTime(bottomTime);
                if (bottomTime <= 30 && bottomTime > 0) bottomClockEl.classList.add("low-time");
                else bottomClockEl.classList.remove("low-time");

                if (activePlayer === bottomPlayer && this.clock.isRunning) bottomClockEl.classList.add("active-clock");
                else bottomClockEl.classList.remove("active-clock");
            }
        };

        this.clock.onTimeOut = (loser) => {
            this.game.state = "timeout";
            this.soundManager.playGameEnd();
            this.showEndCard();
            this.saveAutoSave();
        };

        this.clock.onLowTime = () => {
            this.soundManager.playLowTime();
        };
    }

    private bindDOMControls(): void {
        const btnNew = document.getElementById("btn-new-game");
        if (btnNew) {
            btnNew.addEventListener("click", () => this.newGame());
        }

        const btnUndo = document.getElementById("btn-undo");
        if (btnUndo) {
            btnUndo.addEventListener("click", () => this.undo());
        }

        const btnRedo = document.getElementById("btn-redo");
        if (btnRedo) {
            btnRedo.addEventListener("click", () => this.redo());
        }

        const btnHint = document.getElementById("btn-hint");
        if (btnHint) {
            btnHint.addEventListener("click", () => this.showHint());
        }

        const btnAutoFlip = document.getElementById("btn-autoflip");
        if (btnAutoFlip) {
            btnAutoFlip.addEventListener("click", () => {
                this.autoFlip = !this.autoFlip;
                btnAutoFlip.classList.toggle("active-btn", this.autoFlip);
                if (this.gameMode === "pass_and_play" && this.autoFlip) {
                    const shouldFlip = (this.game.getTurnPlayer() === "b");
                    if (this.boardElement.isFlipped !== shouldFlip) {
                        this.boardElement.setFlipped(shouldFlip);
                        this.updatePlayerLabels();
                        this.refresh();
                    }
                }
            });
        }

        const btnFlip = document.getElementById("btn-flip-board");
        if (btnFlip) {
            btnFlip.addEventListener("click", () => {
                this.boardElement.setFlipped(!this.boardElement.isFlipped);
                this.updatePlayerLabels();
                this.refresh();
            });
        }

        const btnTable = document.getElementById("btn-table-mode");
        if (btnTable) {
            btnTable.addEventListener("click", () => {
                const nextMode = !this.boardElement.tableMode;
                this.boardElement.setTableMode(nextMode);
                btnTable.classList.toggle("active-btn", nextMode);
            });
        }

        const btnSound = document.getElementById("btn-sound");
        if (btnSound) {
            btnSound.addEventListener("click", () => {
                const muted = this.soundManager.toggleMute();
                const label = document.getElementById("sound-label");
                if (label) label.innerText = muted ? "Muted" : "Sound";
                btnSound.classList.toggle("muted-btn", muted);
            });
        }

        const btnDraw = document.getElementById("btn-draw");
        if (btnDraw) {
            btnDraw.addEventListener("click", () => this.offerDraw());
        }

        const btnDrawAccept = document.getElementById("btn-draw-accept");
        const btnDrawDecline = document.getElementById("btn-draw-decline");
        const modalDraw = document.getElementById("modal-draw-offer");

        if (btnDrawAccept) {
            btnDrawAccept.addEventListener("click", () => {
                if (modalDraw) modalDraw.style.display = "none";
                this.acceptDraw();
            });
        }

        if (btnDrawDecline) {
            btnDrawDecline.addEventListener("click", () => {
                if (modalDraw) modalDraw.style.display = "none";
                this.declineDraw();
            });
        }

        if (modalDraw) {
            modalDraw.addEventListener("click", (e) => {
                if (e.target === modalDraw && btnDrawDecline) {
                    btnDrawDecline.click();
                }
            });
        }

        const btnResign = document.getElementById("btn-resign");
        if (btnResign) {
            btnResign.addEventListener("click", () => this.resignGame());
        }

        const selectMode = document.getElementById("select-mode") as HTMLSelectElement | null;
        const rowDifficulty = document.getElementById("row-difficulty");
        const rowTime = document.getElementById("row-time");

        if (selectMode) {
            selectMode.addEventListener("change", () => {
                this.gameMode = selectMode.value as "pass_and_play" | "vs_bot_white" | "vs_bot_black";
                const isBot = this.gameMode.startsWith("vs_bot");

                if (rowDifficulty) {
                    rowDifficulty.style.display = isBot ? "flex" : "none";
                }
                if (rowTime) {
                    rowTime.style.display = isBot ? "none" : "flex";
                }

                this.updateClockVisibility();
                this.newGame();
            });
        }

        const selectDifficulty = document.getElementById("select-difficulty") as HTMLSelectElement | null;
        if (selectDifficulty) {
            selectDifficulty.addEventListener("change", () => {
                this.aiDifficulty = selectDifficulty.value;
                this.updatePlayerLabels();
            });
        }

        const selectTime = document.getElementById("select-time") as HTMLSelectElement | null;
        if (selectTime) {
            selectTime.addEventListener("change", () => {
                if (selectTime.value === "custom") {
                    this.openCustomTimeModal();
                } else {
                    const seconds = parseInt(selectTime.value, 10);
                    this.clock.setTime(seconds);
                    this.newGame();
                }
            });
        }

        const selectTheme = document.getElementById("select-theme") as HTMLSelectElement | null;
        if (selectTheme) {
            selectTheme.addEventListener("change", () => {
                this.setTheme(selectTheme.value);
            });
        }

        // Custom time modal controls
        const modal = document.getElementById("modal-custom-time");
        const btnCustomSet = document.getElementById("btn-custom-set");
        const btnCustomCancel = document.getElementById("btn-custom-cancel");
        const inputCustomMins = document.getElementById("input-custom-minutes") as HTMLInputElement | null;

        if (btnCustomSet) {
            btnCustomSet.addEventListener("click", () => {
                const mins = inputCustomMins ? parseInt(inputCustomMins.value, 10) : 10;
                const validMins = Math.max(1, Math.min(180, isNaN(mins) ? 10 : mins));

                if (selectTime) {
                    const customOption = selectTime.querySelector("option[value='custom']");
                    if (customOption) {
                        customOption.textContent = `Custom (${validMins} min)`;
                    }
                }

                this.clock.setTime(validMins * 60);
                if (modal) modal.style.display = "none";
                this.newGame();
            });
        }

        if (btnCustomCancel) {
            btnCustomCancel.addEventListener("click", () => {
                if (modal) modal.style.display = "none";
                if (selectTime) {
                    const currentSec = this.clock.initialSeconds;
                    if ([180, 300, 600, 900, 0].includes(currentSec)) {
                        selectTime.value = currentSec.toString();
                    } else {
                        selectTime.value = "custom";
                    }
                }
            });
        }

        if (modal) {
            modal.addEventListener("click", (e) => {
                if (e.target === modal && btnCustomCancel) {
                    btnCustomCancel.click();
                }
            });
        }

        const btnCopyPgn = document.getElementById("btn-copy-pgn");
        if (btnCopyPgn) {
            btnCopyPgn.addEventListener("click", () => this.copyPGN());
        }

        this.updateUndoRedoButtons();
    }

    private openCustomTimeModal(): void {
        const modal = document.getElementById("modal-custom-time");
        if (modal) {
            modal.style.display = "flex";
            const input = document.getElementById("input-custom-minutes") as HTMLInputElement | null;
            if (input) {
                input.focus();
                input.select();
            }
        }
    }

    public isAITurn(): boolean {
        if (this.game.state !== "ongoing" || this.aiThinking) return true;
        const turn = this.game.getTurnPlayer();
        return (this.gameMode === "vs_bot_white" && turn === "b") ||
               (this.gameMode === "vs_bot_black" && turn === "w");
    }

    public updateClockVisibility(): void {
        const topClockEl = document.getElementById("clock-top");
        const bottomClockEl = document.getElementById("clock-bottom");
        const hideClock = this.gameMode.startsWith("vs_bot");

        if (topClockEl) {
            topClockEl.style.display = hideClock ? "none" : "";
        }
        if (bottomClockEl) {
            bottomClockEl.style.display = hideClock ? "none" : "";
        }

        const rowTime = document.getElementById("row-time");
        if (rowTime) {
            rowTime.style.display = hideClock ? "none" : "flex";
        }
    }

    newGame(): void {
        this.game = new ChessGame();
        this.boardElement.game = this.game;

        this.undoStack = [];
        this.redoStack = [];
        this.moveQualities = [];
        this.lastEvalScore = 0;
        localStorage.removeItem("chess_autosave");

        this.updateClockVisibility();

        const isBot = this.gameMode.startsWith("vs_bot");
        if (isBot) {
            this.clock.pause();
            this.clock.setTime(0);
        } else {
            const selectTime = document.getElementById("select-time") as HTMLSelectElement | null;
            if (selectTime && selectTime.value !== "custom") {
                const initialSeconds = parseInt(selectTime.value, 10);
                this.clock.setTime(initialSeconds);
            }
        }

        if (this.gameMode === "vs_bot_black") {
            this.boardElement.isFlipped = true;
        } else {
            this.boardElement.isFlipped = false;
        }

        this.boardElement.rebuildBoard();
        this.updatePlayerLabels();
        this.updateUndoRedoButtons();
        this.refresh();

        if (this.gameMode === "vs_bot_black") {
            this.triggerAIMove();
        }
    }

    public pushUndoSnapshot(): void {
        const snapshot = this.game.createSnapshot(this.clock.whiteTime, this.clock.blackTime, this.lastEvalScore);
        this.undoStack.push(snapshot);
        if (this.undoStack.length > 80) this.undoStack.shift();
        this.redoStack = [];
        this.updateUndoRedoButtons();
    }

    public undo(): void {
        if (this.undoStack.length === 0 || this.aiThinking) return;

        // Current snapshot pushed to redo
        const currentSnapshot = this.game.createSnapshot(this.clock.whiteTime, this.clock.blackTime, this.lastEvalScore);
        this.redoStack.push(currentSnapshot);

        let targetSnapshot = this.undoStack.pop()!;

        // Against Bot: If it's the player's turn, rewind both the bot's move and the player's move
        if (this.gameMode.startsWith("vs_bot") && this.undoStack.length > 0) {
            this.redoStack.push(targetSnapshot);
            targetSnapshot = this.undoStack.pop()!;
        }

        this.game.restoreSnapshot(targetSnapshot);

        if (targetSnapshot.whiteTime !== undefined && targetSnapshot.blackTime !== undefined) {
            this.clock.whiteTime = targetSnapshot.whiteTime;
            this.clock.blackTime = targetSnapshot.blackTime;
        }

        if (this.gameMode === "pass_and_play" && this.autoFlip) {
            this.boardElement.setFlipped(this.game.getTurnPlayer() === "b");
        }

        // Trim move qualities list
        this.moveQualities = this.moveQualities.slice(0, this.game.moveHistory.length);

        this.updateUndoRedoButtons();
        this.refresh();
        this.saveAutoSave();
    }

    public redo(): void {
        if (this.redoStack.length === 0 || this.aiThinking) return;

        const currentSnapshot = this.game.createSnapshot(this.clock.whiteTime, this.clock.blackTime, this.lastEvalScore);
        this.undoStack.push(currentSnapshot);

        let targetSnapshot = this.redoStack.pop()!;

        // Against Bot: Redo both player move and bot response if available
        if (this.gameMode.startsWith("vs_bot") && this.redoStack.length > 0) {
            this.undoStack.push(targetSnapshot);
            targetSnapshot = this.redoStack.pop()!;
        }

        this.game.restoreSnapshot(targetSnapshot);

        if (targetSnapshot.whiteTime !== undefined && targetSnapshot.blackTime !== undefined) {
            this.clock.whiteTime = targetSnapshot.whiteTime;
            this.clock.blackTime = targetSnapshot.blackTime;
        }

        if (this.gameMode === "pass_and_play" && this.autoFlip) {
            this.boardElement.setFlipped(this.game.getTurnPlayer() === "b");
        }

        this.updateUndoRedoButtons();
        this.refresh();
        this.saveAutoSave();
    }

    public updateUndoRedoButtons(): void {
        const btnUndo = document.getElementById("btn-undo") as HTMLButtonElement | null;
        const btnRedo = document.getElementById("btn-redo") as HTMLButtonElement | null;

        if (btnUndo) btnUndo.disabled = (this.undoStack.length === 0);
        if (btnRedo) btnRedo.disabled = (this.redoStack.length === 0);
    }

    public async showHint(): Promise<void> {
        if (this.game.state !== "ongoing" || this.aiThinking) return;

        const turn = this.game.getTurnPlayer();
        const bestMove = await AIPlayer.findBestMoveAsync(this.game, turn, this.aiDifficulty, true);

        if (bestMove) {
            this.boardElement.showHint(bestMove.piece, bestMove.destination);
            const statusEl = document.getElementById("status-bar");
            const fromSq = `${String.fromCharCode(97 + bestMove.piece.j)}${8 - bestMove.piece.i}`;
            const toSq = `${String.fromCharCode(97 + bestMove.destination.j)}${8 - bestMove.destination.i}`;
            if (statusEl) {
                statusEl.innerText = `Best move: ${bestMove.piece.name.toUpperCase()} from ${fromSq} to ${toSq}`;
            }
        }
    }

    public isGameOver(): boolean {
        return [
            "checkmate",
            "stalemate",
            "timeout",
            "resigned",
            "draw_insufficient",
            "draw_repetition",
            "draw_fivefold",
            "draw_50move",
            "draw_75move",
            "draw_agreement"
        ].includes(this.game.state);
    }

    public offerDraw(): void {
        if (this.game.state !== "ongoing" || this.aiThinking) return;

        const currentTurn = this.game.getTurnPlayer();
        const offeringPlayer = currentTurn === "w" ? "White" : "Black";
        const otherPlayer = currentTurn === "w" ? "Black" : "White";

        if (this.gameMode === "pass_and_play") {
            const modal = document.getElementById("modal-draw-offer");
            const textEl = document.getElementById("draw-offer-text");
            if (textEl) {
                textEl.innerText = `${offeringPlayer} offers a draw. Does ${otherPlayer} accept?`;
            }
            if (modal) {
                modal.style.display = "flex";
            }
        } else {
            // Against AI Bot: evaluate board from bot's standpoint
            const evalScore = AIPlayer.evaluateBoard(this.game.boardState);
            const botColour = this.gameMode === "vs_bot_white" ? "b" : "w";
            // positive eval is White advantage, negative is Black advantage
            const botAdvantage = (botColour === "w") ? evalScore : -evalScore;

            // Bot accepts if roughly equal or bot is disadvantaged
            if (botAdvantage <= 80) {
                this.acceptDraw();
            } else {
                this.declineDrawByBot();
            }
        }
    }

    public acceptDraw(): void {
        this.game.state = "draw_agreement";
        this.clock.pause();
        this.soundManager.playGameEnd();
        this.refresh();
        this.showEndCard();
        this.saveAutoSave();
    }

    public declineDraw(): void {
        const statusEl = document.getElementById("status-bar");
        if (statusEl) {
            statusEl.innerText = "Draw offer declined. Game continues!";
            statusEl.className = "status-bar";
            setTimeout(() => {
                this.updateStatusBar();
            }, 2000);
        }
    }

    private declineDrawByBot(): void {
        const statusEl = document.getElementById("status-bar");
        if (statusEl) {
            statusEl.innerText = "Computer declines the draw offer! Game continues.";
            statusEl.className = "status-bar check";
            setTimeout(() => {
                this.updateStatusBar();
            }, 2500);
        }
    }

    public resignGame(): void {
        if (this.game.state !== "ongoing") return;

        const turn = this.game.getTurnPlayer();
        const winner = turn === "w" ? "Black" : "White";

        this.game.state = "resigned";
        this.clock.pause();
        this.soundManager.playGameEnd();

        const statusEl = document.getElementById("status-bar");
        if (statusEl) {
            statusEl.innerText = `${turn === "w" ? "White" : "Black"} resigned. ${winner} wins!`;
            statusEl.className = "status-bar checkmate";
        }

        this.showEndCard();
        this.saveAutoSave();
    }

    public processSelection(position: BoardPosition): void {
        if (this.isAITurn()) return;

        const moveCountBefore = this.game.moveHistory.length;
        const prevEval = AIPlayer.evaluateBoard(this.game.boardState);

        // Save snapshot before move
        if (this.game.moveTracker.active) {
            const piece = this.game.moveTracker.activePiece;
            const isMoveValid = piece.possibleMoves.some(m => m.i === position.i && m.j === position.j);
            if (isMoveValid) {
                this.pushUndoSnapshot();
            }
        }

        const piece: Piece = this.game.submitSelection(position);
        const moveMade = this.game.moveHistory.length > moveCountBefore;

        if (moveMade) {
            this.evaluateLatestMoveQuality(prevEval);

            if (!this.gameMode.startsWith("vs_bot")) {
                this.clock.start();
                this.clock.switchTurn(this.game.getTurnPlayer());
            }
            this.playMoveSound();

            if (this.gameMode === "pass_and_play" && this.autoFlip) {
                const turn = this.game.getTurnPlayer();
                const shouldFlip = (turn === "b");
                if (this.boardElement.isFlipped !== shouldFlip) {
                    this.boardElement.setFlipped(shouldFlip);
                }
            }

            this.saveAutoSave();
        }

        this.refresh();

        if (this.game.moveTracker.active) {
            this.boardElement.highlightActivePiece(piece);
        }

        if (moveMade) {
            this.triggerAIMove();
        }
    }

    private evaluateLatestMoveQuality(evalBefore: number): void {
        const evalAfter = AIPlayer.evaluateBoard(this.game.boardState);
        const lastMoveStr = this.game.moveHistory[this.game.moveHistory.length - 1];
        const turnWhoMoved = (this.game.turncount % 2 === 1) ? "w" : "b"; // previous turn player

        // Evaluation delta from perspective of the player who just moved
        const delta = turnWhoMoved === "w" ? (evalBefore - evalAfter) : (evalAfter - evalBefore);

        let quality: MoveQuality = "best";
        if (delta <= 25) quality = "best";
        else if (delta <= 80) quality = "good";
        else if (delta <= 180) quality = "inaccuracy";
        else if (delta <= 350) quality = "mistake";
        else quality = "blunder";

        this.moveQualities.push({ move: lastMoveStr, quality });
        this.lastEvalScore = evalAfter;
    }

    private playMoveSound(): void {
        if (this.isGameOver()) {
            this.soundManager.playGameEnd();
            return;
        }

        const latestMove = this.game.lastMoves && this.game.lastMoves.length > 0 ? this.game.lastMoves[0] : null;
        const nextPlayer = this.game.getTurnPlayer();
        const king = this.game.getKingOfColour(nextPlayer);

        if (king.threatened) {
            this.soundManager.playCheck();
        } else if (latestMove && latestMove.piece.name === "king" && Math.abs(latestMove.from.j - latestMove.to.j) === 2) {
            this.soundManager.playCastle();
        } else if (latestMove && latestMove.captured) {
            this.soundManager.playCapture();
        } else {
            this.soundManager.playMove();
        }
    }

    private triggerAIMove(): void {
        if (this.game.state !== "ongoing") return;
        if (!this.isAITurn()) return;

        this.aiThinking = true;
        this.updateStatusBar();

        const profile = AIPlayer.getProfile(this.aiDifficulty);
        const minD = profile.minDelay || 800;
        const maxD = profile.maxDelay || 1500;
        const delay = Math.floor(Math.random() * (maxD - minD + 1)) + minD;

        setTimeout(() => {
            this.executeAIMove();
        }, delay);
    }

    private async executeAIMove(): Promise<void> {
        if (this.game.state !== "ongoing") {
            this.aiThinking = false;
            return;
        }

        const botColour = this.game.getTurnPlayer();
        const prevEval = AIPlayer.evaluateBoard(this.game.boardState);

        this.pushUndoSnapshot();
        const bestMove = await AIPlayer.findBestMoveAsync(this.game, botColour, this.aiDifficulty);

        if (this.game.state !== "ongoing") {
            this.aiThinking = false;
            return;
        }

        if (bestMove) {
            this.game.makeMove(bestMove.piece, bestMove.destination);

            if (this.game.state === "promotion") {
                const promoMap: Record<string, string> = { q: "Queen", r: "Rook", b: "Bishop", n: "Knight" };
                const promoChar = (bestMove.uci && bestMove.uci.length === 5) ? bestMove.uci[4] : "q";
                this.game.submitPromotionChoice(promoMap[promoChar] || "Queen");
                this.soundManager.playPromote();
            }

            this.evaluateLatestMoveQuality(prevEval);
            if (!this.gameMode.startsWith("vs_bot")) {
                this.clock.start();
                this.clock.switchTurn(this.game.getTurnPlayer());
            }
            this.playMoveSound();

            if (this.gameMode === "pass_and_play" && this.autoFlip) {
                const turn = this.game.getTurnPlayer();
                const shouldFlip = (turn === "b");
                if (this.boardElement.isFlipped !== shouldFlip) {
                    this.boardElement.setFlipped(shouldFlip);
                }
            }

            this.saveAutoSave();
        }

        this.aiThinking = false;
        this.refresh();
    }

    refresh(): void {
        this.boardElement.repaint();
        this.updatePlayerLabels();
        this.updateCapturedAndMaterial();
        this.updateNotationList();
        this.updateEvaluationBar();
        this.updateOpeningBanner();
        this.updateStatusBar();
        this.updateUndoRedoButtons();

        if (this.isGameOver()) {
            this.clock.pause();
            this.showEndCard();
        }

        if (this.game.state === "promotion") {
            this.clock.pause();
            this.askPromotionOption();
        }
    }

    private updateEvaluationBar(): void {
        const fillEl = document.getElementById("eval-bar-fill");
        const scoreEl = document.getElementById("eval-bar-score");
        const wrapperEl = document.getElementById("eval-bar-wrapper");
        if (!fillEl || !scoreEl || !wrapperEl) return;

        const evalScore = AIPlayer.evaluateBoard(this.game.boardState);
        this.lastEvalScore = evalScore;

        if (this.game.state === "checkmate") {
            const winner = (this.game.turncount % 2 === 0) ? "b" : "w";
            if (winner === "w") {
                fillEl.style.height = "100%";
                scoreEl.innerText = "+M";
                wrapperEl.classList.remove("black-winning");
            } else {
                fillEl.style.height = "0%";
                scoreEl.innerText = "-M";
                wrapperEl.classList.add("black-winning");
            }
            return;
        }

        // Logistic / sigmoid mapping of centipawn evaluation into 0-100%
        const whitePercent = Math.max(5, Math.min(95, 50 + (evalScore / 25)));
        fillEl.style.height = `${whitePercent}%`;

        const pawns = (Math.abs(evalScore) / 100).toFixed(1);
        if (evalScore > 0) {
            scoreEl.innerText = `+${pawns}`;
            wrapperEl.classList.remove("black-winning");
        } else if (evalScore < 0) {
            scoreEl.innerText = `-${pawns}`;
            wrapperEl.classList.add("black-winning");
        } else {
            scoreEl.innerText = "0.0";
            wrapperEl.classList.remove("black-winning");
        }
    }

    private updateOpeningBanner(): void {
        const banner = document.getElementById("opening-banner");
        const nameEl = document.getElementById("opening-name");
        if (!banner || !nameEl) return;

        const opening = detectOpening(this.game.moveHistory);
        if (opening) {
            nameEl.innerText = opening;
            banner.style.display = "flex";
        } else {
            banner.style.display = "none";
        }
    }

    onPromotionChoiceSubmitted(): void {
        this.soundManager.playPromote();
        if (this.game.state === "ongoing") {
            this.clock.start();

            if (this.gameMode === "pass_and_play" && this.autoFlip) {
                const turn = this.game.getTurnPlayer();
                const shouldFlip = (turn === "b");
                if (this.boardElement.isFlipped !== shouldFlip) {
                    this.boardElement.setFlipped(shouldFlip);
                }
            }
        }
        this.saveAutoSave();
        this.refresh();
        this.triggerAIMove();
    }

    updatePlayerLabels(): void {
        const topNameEl = document.getElementById("top-player-name");
        const bottomNameEl = document.getElementById("bottom-player-name");

        const isFlipped = this.boardElement.isFlipped;
        const topColour = isFlipped ? "White" : "Black";
        const bottomColour = isFlipped ? "Black" : "White";

        let topLabel = topColour;
        let bottomLabel = bottomColour;

        const profile = AIPlayer.getProfile(this.aiDifficulty);
        const botDisplayName = `${profile.name} (${profile.elo})`;

        if (this.gameMode === "vs_bot_white") {
            topLabel = botDisplayName;
            bottomLabel = "You (White)";
        } else if (this.gameMode === "vs_bot_black") {
            topLabel = botDisplayName;
            bottomLabel = "You (Black)";
        }

        if (topNameEl) topNameEl.innerText = topLabel;
        if (bottomNameEl) bottomNameEl.innerText = bottomLabel;
    }

    updateCapturedAndMaterial(): void {
        const isFlipped = this.boardElement.isFlipped;
        const topTray = document.getElementById("top-captured");
        const bottomTray = document.getElementById("bottom-captured");
        const topAdvantage = document.getElementById("top-advantage");
        const bottomAdvantage = document.getElementById("bottom-advantage");

        const mat = this.game.getMaterialCount();

        const topCapturedList = isFlipped ? this.game.capturedPieces.w : this.game.capturedPieces.b;
        const bottomCapturedList = isFlipped ? this.game.capturedPieces.b : this.game.capturedPieces.w;

        const topImgColour = isFlipped ? "b" : "w";
        const bottomImgColour = isFlipped ? "w" : "b";

        if (topTray) {
            topTray.innerHTML = "";
            topCapturedList.forEach(name => {
                const img = document.createElement("img");
                img.classList.add("mini-piece");
                img.src = `assets/${name}_${topImgColour}.png`;
                topTray.appendChild(img);
            });
        }

        if (bottomTray) {
            bottomTray.innerHTML = "";
            bottomCapturedList.forEach(name => {
                const img = document.createElement("img");
                img.classList.add("mini-piece");
                img.src = `assets/${name}_${bottomImgColour}.png`;
                bottomTray.appendChild(img);
            });
        }

        const topAdvantageIsMine = isFlipped ? (mat.advantage === "w") : (mat.advantage === "b");
        const bottomAdvantageIsMine = isFlipped ? (mat.advantage === "b") : (mat.advantage === "w");

        if (topAdvantage) {
            topAdvantage.innerText = (topAdvantageIsMine && mat.diff > 0) ? `+${mat.diff}` : "";
        }
        if (bottomAdvantage) {
            bottomAdvantage.innerText = (bottomAdvantageIsMine && mat.diff > 0) ? `+${mat.diff}` : "";
        }
    }

    updateNotationList(): void {
        const listEl = document.getElementById("notation-list");
        if (!listEl) return;

        listEl.innerHTML = "";
        const history = this.game.moveHistory;

        for (let i = 0; i < history.length; i += 2) {
            const moveNum = Math.floor(i / 2) + 1;
            const whiteMove = history[i] || "";
            const blackMove = history[i + 1] || "";

            const whiteQual = this.moveQualities[i]?.quality;
            const blackQual = this.moveQualities[i + 1]?.quality;

            const row = document.createElement("div");
            row.classList.add("notation-row");

            const numSpan = document.createElement("span");
            numSpan.classList.add("notation-num");
            numSpan.innerText = `${moveNum}.`;

            const whiteSpan = document.createElement("span");
            whiteSpan.classList.add("notation-white");
            whiteSpan.innerText = whiteMove;
            if (whiteQual) {
                const badge = document.createElement("span");
                badge.className = `eval-badge ${whiteQual}`;
                badge.innerText = this.getBadgeSymbol(whiteQual);
                badge.title = whiteQual;
                whiteSpan.appendChild(badge);
            }

            const blackSpan = document.createElement("span");
            blackSpan.classList.add("notation-black");
            blackSpan.innerText = blackMove;
            if (blackQual && blackMove) {
                const badge = document.createElement("span");
                badge.className = `eval-badge ${blackQual}`;
                badge.innerText = this.getBadgeSymbol(blackQual);
                badge.title = blackQual;
                blackSpan.appendChild(badge);
            }

            row.appendChild(numSpan);
            row.appendChild(whiteSpan);
            row.appendChild(blackSpan);
            listEl.appendChild(row);
        }

        listEl.scrollTop = listEl.scrollHeight;
    }

    private getBadgeSymbol(quality: MoveQuality): string {
        switch (quality) {
            case "best": return "!";
            case "good": return "!";
            case "inaccuracy": return "?!";
            case "mistake": return "?";
            case "blunder": return "??";
        }
    }

    updateStatusBar(): void {
        const statusEl = document.getElementById("status-bar");
        if (!statusEl) return;

        if (this.aiThinking) {
            const profile = AIPlayer.getProfile(this.aiDifficulty);
            statusEl.innerText = `${profile.name} (${profile.elo}) is thinking...`;
            statusEl.className = "status-bar thinking";
            return;
        }

        const turn = this.game.getTurnPlayer() === "w" ? "White" : "Black";
        const king = this.game.getKingOfColour(this.game.getTurnPlayer());

        if (this.game.state === "checkmate") {
            const winner = this.game.getTurnPlayer() === "w" ? "Black" : "White";
            statusEl.innerText = `Checkmate! ${winner} wins!`;
            statusEl.className = "status-bar checkmate";
        } else if (this.game.state === "stalemate") {
            statusEl.innerText = "Draw by Stalemate!";
            statusEl.className = "status-bar draw";
        } else if (this.game.state === "draw_insufficient") {
            statusEl.innerText = "Draw by Insufficient Material!";
            statusEl.className = "status-bar draw";
        } else if (this.game.state === "draw_fivefold") {
            statusEl.innerText = "Draw by Fivefold Repetition!";
            statusEl.className = "status-bar draw";
        } else if (this.game.state === "draw_repetition") {
            statusEl.innerText = "Draw by Threefold Repetition!";
            statusEl.className = "status-bar draw";
        } else if (this.game.state === "draw_75move") {
            statusEl.innerText = "Draw by 75-Move Rule!";
            statusEl.className = "status-bar draw";
        } else if (this.game.state === "draw_50move") {
            statusEl.innerText = "Draw by 50-Move Rule!";
            statusEl.className = "status-bar draw";
        } else if (this.game.state === "draw_agreement") {
            statusEl.innerText = "Draw by Mutual Agreement!";
            statusEl.className = "status-bar draw";
        } else if (this.game.state === "timeout") {
            const winner = this.game.getTurnPlayer() === "w" ? "Black" : "White";
            statusEl.innerText = `Time out! ${winner} wins!`;
            statusEl.className = "status-bar timeout";
        } else if (this.game.state === "resigned") {
            statusEl.innerText = `Game ended by resignation.`;
            statusEl.className = "status-bar checkmate";
        } else if (king.threatened) {
            statusEl.innerText = `${turn} is in check!`;
            statusEl.className = "status-bar check";
        } else {
            statusEl.innerText = `${turn} to move`;
            statusEl.className = "status-bar";
        }
    }

    copyPGN(): void {
        const history = this.game.moveHistory;
        if (history.length === 0) return;

        let pgn = "";
        for (let i = 0; i < history.length; i += 2) {
            const moveNum = Math.floor(i / 2) + 1;
            const w = history[i] || "";
            const b = history[i + 1] || "";
            pgn += `${moveNum}. ${w} ${b} `.trim() + " ";
        }

        navigator.clipboard.writeText(pgn.trim()).then(() => {
            const btn = document.getElementById("btn-copy-pgn");
            if (btn) {
                const original = btn.innerText;
                btn.innerText = "Copied!";
                setTimeout(() => { btn.innerText = original; }, 1500);
            }
        }).catch(() => {});
    }

    askPromotionOption(): void {
        const promotionCard = new PromotionCard(this, this.game);
        this.boardContainer.appendChild(promotionCard.element);
    }

    showEndCard(): void {
        const existing = this.boardContainer.querySelector(".end-card");
        if (existing) existing.remove();
        const endCard = new EndCard(this, this.game);
        this.boardContainer.appendChild(endCard.element);
    }
}