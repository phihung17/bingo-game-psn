export interface BingoCell {
  number: number;
  isMarked: boolean;
}

export type GameStatus =
  | "waiting"
  | "board-creation"
  | "playing"
  | "player1-wins"
  | "player2-wins"
  | "tie";

export interface Player {
  playerNumber: number;
  name: string;
  isConnected: boolean;
}

export interface Scoreboard {
  player1: number;
  player2: number;
}

export interface GameState {
  player1Board: BingoCell[][];
  player2Board: BingoCell[][];
  currentPlayer: 1 | 2;
  calledNumbers: number[];
  gameStatus: GameStatus;
  yourPlayerNumber?: number;
  players?: Player[];
  scoreboard: Scoreboard;
}
