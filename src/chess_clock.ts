export class ChessClock {
    public whiteTime: number;
    public blackTime: number;
    public initialTime: number;
    public activePlayer: string = "w";
    public isRunning: boolean = false;
    private timerId: number | null = null;
    private lastTimestamp: number = 0;

    public onTick?: (whiteTime: number, blackTime: number, activePlayer: string) => void;
    public onTimeOut?: (loser: string) => void;
    public onLowTime?: () => void;

    private lowTimeWarningWhite: boolean = false;
    private lowTimeWarningBlack: boolean = false;

    constructor(initialSeconds: number = 600) {
        this.initialTime = initialSeconds;
        this.whiteTime = initialSeconds;
        this.blackTime = initialSeconds;
    }

    public setTime(initialSeconds: number): void {
        this.pause();
        this.initialTime = initialSeconds;
        this.whiteTime = initialSeconds;
        this.blackTime = initialSeconds;
        this.activePlayer = "w";
        this.lowTimeWarningWhite = false;
        this.lowTimeWarningBlack = false;
        if (this.onTick) {
            this.onTick(this.whiteTime, this.blackTime, this.activePlayer);
        }
    }

    public start(): void {
        if (this.initialTime <= 0) return; // Unlimited mode
        if (this.isRunning) return;

        this.isRunning = true;
        this.lastTimestamp = Date.now();

        this.timerId = window.setInterval(() => {
            const now = Date.now();
            const elapsed = (now - this.lastTimestamp) / 1000;
            this.lastTimestamp = now;

            if (this.activePlayer === "w") {
                this.whiteTime = Math.max(0, this.whiteTime - elapsed);
                if (this.whiteTime <= 30 && !this.lowTimeWarningWhite) {
                    this.lowTimeWarningWhite = true;
                    if (this.onLowTime) this.onLowTime();
                }
                if (this.whiteTime <= 0) {
                    this.pause();
                    if (this.onTimeOut) this.onTimeOut("w");
                }
            } else {
                this.blackTime = Math.max(0, this.blackTime - elapsed);
                if (this.blackTime <= 30 && !this.lowTimeWarningBlack) {
                    this.lowTimeWarningBlack = true;
                    if (this.onLowTime) this.onLowTime();
                }
                if (this.blackTime <= 0) {
                    this.pause();
                    if (this.onTimeOut) this.onTimeOut("b");
                }
            }

            if (this.onTick) {
                this.onTick(this.whiteTime, this.blackTime, this.activePlayer);
            }
        }, 100);
    }

    public pause(): void {
        if (this.timerId !== null) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
        this.isRunning = false;
    }

    public switchTurn(turnPlayer: string): void {
        this.activePlayer = turnPlayer;
        this.lastTimestamp = Date.now();
        if (this.onTick) {
            this.onTick(this.whiteTime, this.blackTime, this.activePlayer);
        }
    }

    public static formatTime(seconds: number): string {
        if (seconds <= 0) return "0:00";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        const sStr = s < 10 ? `0${s}` : `${s}`;
        return `${m}:${sStr}`;
    }
}
