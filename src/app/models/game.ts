export type Player = 'X' | 'O' | null;
export type GameMode = 'PvP' | 'PvC';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type GameStatus = 'InProgress' | 'Won' | 'Draw';

export interface Move {
  moveNumber: number;
  player: Player;
  position: { row: number, col: number };
  timestamp: string;
}

export interface GameState {
  gameId: string;
  board: Player[][];
  currentPlayer: Player;
  gameMode: GameMode;
  difficulty: Difficulty | null;
  status: GameStatus;
  winner: Player;
  winningCells: { row: number, col: number }[];
  moveHistory: Move[];
  canUndo: boolean;
}

export interface Scoreboard {
  pvp: { xWins: number, oWins: number, draws: number };
  pvc: { xWins: number, oWins: number, draws: number };
}
