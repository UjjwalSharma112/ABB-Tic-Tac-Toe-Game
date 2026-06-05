import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { GameService } from './services/game.service';
import { GameMode, Move, Difficulty } from './models/game';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  public gameService = inject(GameService);

  public currentMode: GameMode = 'PvP';
  public currentDifficulty: Difficulty = 'Easy';

  get state() { return this.gameService.gameState(); }
  get scores() { return this.gameService.scoreboard(); }
  get error() { return this.gameService.error(); }

  setBackend(useMock: boolean) {
    this.gameService.toggleMode(useMock);
  }

  setGameMode(mode: GameMode) {
    this.currentMode = mode;
    this.gameService.createGame(this.currentMode, this.currentDifficulty);
  }

  setDifficulty(diff: Difficulty) {
    this.currentDifficulty = diff;
    this.gameService.createGame(this.currentMode, this.currentDifficulty);
  }

  makeMove(row: number, col: number) {
    this.gameService.makeMove(row, col);
  }

  undoMove() {
     this.gameService.undoMove();
  }

  resetGame() {
     this.gameService.resetGame();
  }

  resetScoreboard() {
     this.gameService.resetScoreboard();
  }

  getCell(row: number, col: number): string | null {
     return this.state?.board[row]?.[col] || null;
  }

  isWinningCell(row: number, col: number): boolean {
     if (!this.state?.winningCells) return false;
     return this.state.winningCells.some(c => c.row === row && c.col === col);
  }

  trackMove(index: number, move: Move) {
     return move.moveNumber;
  }
}
