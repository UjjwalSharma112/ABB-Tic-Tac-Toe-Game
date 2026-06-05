import { Injectable } from '@angular/core';
import { GameState, GameMode, Player, Move, Scoreboard, GameStatus, Difficulty } from '../models/game';

@Injectable({providedIn: 'root'})
export class MockEngineService {
  private games = new Map<string, GameState>();
  private scoreboard: Scoreboard = {
    pvp: { xWins: 0, oWins: 0, draws: 0 },
    pvc: { xWins: 0, oWins: 0, draws: 0 }
  };

  createGame(mode: GameMode, difficulty: Difficulty = 'Hard'): GameState {
    const gameId = crypto.randomUUID();
    const board: Player[][] = Array(3).fill(null).map(() => Array(3).fill(null));
    const state: GameState = {
      gameId, board, currentPlayer: 'X', gameMode: mode, difficulty, status: 'InProgress', winner: null, winningCells: [], moveHistory: []
    };
    this.games.set(gameId, state);
    return this.clone(state);
  }

  getGame(id: string): GameState {
    const game = this.games.get(id);
    if (!game) throw new Error('Game not found');
    return this.clone(game);
  }

  makeMove(id: string, player: Player, row: number, col: number): GameState {
    const game = this.games.get(id);
    if (!game) throw new Error('Game not found');
    if (game.status !== 'InProgress') throw new Error('Game already completed');
    if (game.currentPlayer !== player) throw new Error('Not your turn');
    if (row < 0 || row > 2 || col < 0 || col > 2) throw new Error('Invalid position');
    if (game.board[row][col] !== null) throw new Error('Cell occupied');

    game.board[row][col] = player;
    game.moveHistory.push({
      moveNumber: game.moveHistory.length + 1,
      player,
      position: { row, col },
      timestamp: new Date().toISOString()
    });

    this.updateGameStatus(game);

    if (game.gameMode === 'PvC' && game.status === 'InProgress' && game.currentPlayer === 'O') {
      this.makeComputerMove(game);
      this.updateGameStatus(game);
    }

    return this.clone(game);
  }

  undoMove(id: string): GameState {
    const game = this.games.get(id);
    if (!game) throw new Error('Game not found');
    if (game.moveHistory.length === 0) throw new Error('No moves to undo');

    const wasCompleted = game.status !== 'InProgress';
    let oldWinner = game.winner;
    let oldStatus = game.status;

    if (game.gameMode === 'PvP') {
       const lastMove = game.moveHistory.pop()!;
       game.board[lastMove.position.row][lastMove.position.col] = null;
       game.currentPlayer = lastMove.player;
    } else {
       const lastMove = game.moveHistory.pop()!;
       game.board[lastMove.position.row][lastMove.position.col] = null;
       game.currentPlayer = lastMove.player;

       if (lastMove.player === 'O' && game.moveHistory.length > 0) {
           const humanMove = game.moveHistory.pop()!;
           game.board[humanMove.position.row][humanMove.position.col] = null;
           game.currentPlayer = humanMove.player;
       }
    }

    game.status = 'InProgress';
    game.winner = null;
    game.winningCells = [];

    if (wasCompleted) {
        const stats = game.gameMode === 'PvP' ? this.scoreboard.pvp : this.scoreboard.pvc;
        if (oldStatus === 'Won') {
            if (oldWinner === 'X') stats.xWins--;
            if (oldWinner === 'O') stats.oWins--;
        } else if (oldStatus === 'Draw') {
            stats.draws--;
        }
    }

    return this.clone(game);
  }

  resetGame(id: string): GameState {
     const game = this.games.get(id);
     if (!game) throw new Error('Game not found');
     game.board = Array(3).fill(null).map(() => Array(3).fill(null));
     game.currentPlayer = 'X';
     game.status = 'InProgress';
     game.winner = null;
     game.winningCells = [];
     game.moveHistory = [];
     return this.clone(game);
  }

  getScoreboard(): Scoreboard {
    return this.clone(this.scoreboard);
  }

  resetScoreboard(): Scoreboard {
    this.scoreboard = {
      pvp: { xWins: 0, oWins: 0, draws: 0 },
      pvc: { xWins: 0, oWins: 0, draws: 0 }
    };
    return this.clone(this.scoreboard);
  }

  private updateGameStatus(game: GameState) {
     const win = this.checkWin(game.board);
     if (win) {
         game.status = 'Won';
         game.winner = win.player;
         game.winningCells = win.cells;
         const stats = game.gameMode === 'PvP' ? this.scoreboard.pvp : this.scoreboard.pvc;
         if (win.player === 'X') stats.xWins++;
         if (win.player === 'O') stats.oWins++;
     } else if (this.isBoardFull(game.board)) {
         game.status = 'Draw';
         const stats = game.gameMode === 'PvP' ? this.scoreboard.pvp : this.scoreboard.pvc;
         stats.draws++;
     } else {
         game.currentPlayer = game.currentPlayer === 'X' ? 'O' : 'X';
     }
  }

  private checkWin(board: Player[][]): { player: Player, cells: {row: number, col: number}[]} | null {
     for(let r=0; r<3; r++) {
       if (board[r][0] && board[r][0] === board[r][1] && board[r][1] === board[r][2]) {
         return { player: board[r][0], cells: [{row: r, col: 0}, {row: r, col: 1}, {row: r, col: 2}] };
       }
     }
     for(let c=0; c<3; c++) {
       if (board[0][c] && board[0][c] === board[1][c] && board[1][c] === board[2][c]) {
         return { player: board[0][c], cells: [{row: 0, col: c}, {row: 1, col: c}, {row: 2, col: c}] };
       }
     }
     if (board[0][0] && board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
         return { player: board[0][0], cells: [{row: 0, col: 0}, {row: 1, col: 1}, {row: 2, col: 2}] };
     }
     if (board[0][2] && board[0][2] === board[1][1] && board[1][1] === board[2][0]) {
         return { player: board[0][2], cells: [{row: 0, col: 2}, {row: 1, col: 1}, {row: 2, col: 0}] };
     }
     return null;
  }

  private isBoardFull(board: Player[][]) {
     return board.every(row => row.every(cell => cell !== null));
  }

  private makeComputerMove(game: GameState) {
     const player: Player = 'O';
     const opponent: Player = 'X';
     const board = game.board;

     if (game.difficulty === 'Easy') {
        this.makeRandomMove(game, player);
        return;
     }

     if (game.difficulty === 'Medium') {
        let m = this.findWinningMove(board, player);
        if (m) { this.applyComputerMove(game, player, m.row, m.col); return; }

        m = this.findWinningMove(board, opponent);
        if (m) { this.applyComputerMove(game, player, m.row, m.col); return; }

        this.makeRandomMove(game, player);
        return;
     }

     let move = this.findWinningMove(board, player);
     if (move) { this.applyComputerMove(game, player, move.row, move.col); return; }

     move = this.findWinningMove(board, opponent);
     if (move) { this.applyComputerMove(game, player, move.row, move.col); return; }

     if (!board[1][1]) { this.applyComputerMove(game, player, 1, 1); return; }

     const corners = [[0,0], [0,2], [2,0], [2,2]];
     for(let c of corners) {
        if (!board[c[0]][c[1]]) { this.applyComputerMove(game, player, c[0], c[1]); return; }
     }

     for(let r=0; r<3; r++) {
       for(let c=0; c<3; c++) {
         if (!board[r][c]) { this.applyComputerMove(game, player, r, c); return; }
       }
     }
  }

  private makeRandomMove(game: GameState, player: Player) {
     const emptyCells = [];
     for(let r=0; r<3; r++) {
       for(let c=0; c<3; c++) {
         if (!game.board[r][c]) emptyCells.push({row: r, col: c});
       }
     }
     if (emptyCells.length > 0) {
        const move = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        this.applyComputerMove(game, player, move.row, move.col);
     }
  }

  private findWinningMove(board: Player[][], player: Player): {row: number, col: number} | null {
     for(let r=0; r<3; r++) {
       for(let c=0; c<3; c++) {
         if (!board[r][c]) {
            board[r][c] = player;
            const win = this.checkWin(board);
            board[r][c] = null;
            if (win) return {row: r, col: c};
         }
       }
     }
     return null;
  }

  private applyComputerMove(game: GameState, player: Player, row: number, col: number) {
     game.board[row][col] = player;
     game.moveHistory.push({
        moveNumber: game.moveHistory.length + 1,
        player,
        position: { row, col },
        timestamp: new Date().toISOString()
     });
  }

  private clone<T>(obj: T): T {
     return JSON.parse(JSON.stringify(obj));
  }
}
