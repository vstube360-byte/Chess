
import { BoardPosition } from "./board_position.js";
import { Piece } from "./piece.js";

export class AnalysisBoard {

    public board: string[][] = [];
    public kingPosition: BoardPosition = new BoardPosition(0, 0);
    public threats: string[] = [];
    public colour: string;

    constructor(boardState: Piece[][], friendlyColour: string) {

        this.colour = friendlyColour;

        for (let i = 0; i < 8; i++) {
            const line: string[] = [];

            for (let j = 0; j < 8; j++) {
                const piece: Piece = boardState[i][j];

                if (piece.colour == friendlyColour) {
                    if (piece.name == "king") {
                        line.push("start")
                    } else {
                        line.push("wall");
                    }
                } else {
                    line.push(piece.name);
                }
            }

            this.board.push(line);
        }
    }

    submitMove(start: BoardPosition, end: BoardPosition): void {

        const isDiagonalToEmpty = (start.j !== end.j) && (this.board[end.i][end.j] === "empty");
        const isEnPassant = isDiagonalToEmpty && (this.board[start.i][start.j] === "wall") && (this.board[start.i][end.j] === "pawn");

        this.board[end.i][end.j] = this.board[start.i][start.j];
        this.board[start.i][start.j] = "empty";

        if (isEnPassant) {
            this.board[start.i][end.j] = "empty";
        }
    }

    getKingPosition(): BoardPosition {

        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (this.board[i][j] == "start"){
                    return new BoardPosition(i, j);
                }
            }
        }

        return new BoardPosition(0, 0);
    }

    isSafe() {

        const position: BoardPosition = this.getKingPosition();
        if (this.kingIsThreatened(position)) {
            return false;
        }
        return true;
    }

    kingIsThreatened(position: BoardPosition): boolean {

        if (this.checkForPawn(position)){
            return true;
        }

        if (this.checkForKing(position)){
            return true;
        }

        if (this.checkForDiagonals(position)){
            return true;
        }

        if (this.checkForPawn(position)){
            return true;
        }

        if (this.checkForKnight(position)){
            return true;
        }

        if (this.checkForStraights(position)){
            return true;
        }

        return false;
    }

    validCoordinates(i: number, j: number): boolean {

        return (0 <= i && i < 8 && 0 <= j && j < 8);
    }

    checkLocation(i: number, j: number) : string {

        if (this.validCoordinates(i, j)){
            return this.board[i][j];
        }
        return "wall";
    }

    firstObstacleAlongImpulse(position: BoardPosition, di: number, dj: number){

        var i = position.i + di;
        var j = position.j + dj;
        var result: string = this.checkLocation(i, j);

        while (result == "empty") {
            i += di;
            j += dj;
            result = this.checkLocation(i, j);
        }

        return result;
    }

    checkForDiagonals(position: BoardPosition) : boolean {

        const threats = [];

        const northEast: string = this.firstObstacleAlongImpulse(position, -1, 1);
        const southEast: string = this.firstObstacleAlongImpulse(position, 1, 1);
        const southWest: string = this.firstObstacleAlongImpulse(position, 1, -1);
        const northWest: string = this.firstObstacleAlongImpulse(position, -1, -1);

        threats.push(northEast);
        threats.push(southEast);
        threats.push(southWest);
        threats.push(northWest);

        return (this.containsThreat(threats, "bishop") || this.containsThreat(threats, "queen"));
    }

    checkForKing(position: BoardPosition) : boolean {

        const threats = []

        for (let a = -1; a <= 1; a++) {
            for (let b = -1; b <= 1; b++) {
                const threat = this.checkLocation(position.i + a, position.j + b);
                threats.push(threat);
            }
        }

        return this.containsThreat(threats, "king");
    }

    checkForKnight(position: BoardPosition): boolean {

        const threats = []

        const one = this.checkLocation(position.i + 1, position.j - 2);
        const two = this.checkLocation(position.i + 2, position.j - 1);
        const three = this.checkLocation(position.i + 2, position.j + 1);
        const four = this.checkLocation(position.i + 1, position.j + 2);

        const five = this.checkLocation(position.i - 1, position.j - 2);
        const six = this.checkLocation(position.i - 2, position.j - 1);
        const seven = this.checkLocation(position.i - 2, position.j + 1);
        const eight = this.checkLocation(position.i - 1, position.j + 2);

        threats.push(one);
        threats.push(two);
        threats.push(three);
        threats.push(four);
        threats.push(five);
        threats.push(six);
        threats.push(seven);
        threats.push(eight);

        return this.containsThreat(threats, "knight");
    }

    checkForStraights(position: BoardPosition): boolean {

        const threats = []

        const north: string = this.firstObstacleAlongImpulse(position, -1, 0);
        const south: string = this.firstObstacleAlongImpulse(position, 1, 0);
        const west: string = this.firstObstacleAlongImpulse(position, 0, -1);
        const east: string = this.firstObstacleAlongImpulse(position, 0, 1);

        threats.push(north);
        threats.push(south);
        threats.push(west);
        threats.push(east);

        return (this.containsThreat(threats, "rook") || this.containsThreat(threats, "queen"));
    }

    checkForPawn(position: BoardPosition) : boolean {

        const threats = []
        var row = position.i;
        if (this.colour == "b"){
            row += 1;
        } else {
            row -= 1;
        }
        
        const one = this.checkLocation(row, position.j - 1);
        const two = this.checkLocation(row, position.j + 1);
        threats.push(one);
        threats.push(two);

        return this.containsThreat(threats, "pawn");
    }

    containsThreat(possibleDangers : string[], threat: string){

        const n = possibleDangers.length;
        for(let i=0; i<n; i++){
            if (possibleDangers[i] == threat){
                return true;
            }
        }

        return false;
    }
}