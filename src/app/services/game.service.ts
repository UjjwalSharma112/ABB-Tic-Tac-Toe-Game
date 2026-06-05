import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { GameState, GameMode, Scoreboard, Difficulty, Move } from '../models/game';

@Injectable({providedIn: 'root'})
export class GameService {
  private http = inject(HttpClient);

  public apiUrl = signal<string>('http://localhost:5033/api');

  public gameState = signal<GameState | null>(null);
  public scoreboard = signal<Scoreboard | null>(null);
  public error = signal<string | null>(null);

  constructor() {
    this.refreshScoreboard();
    this.createGame('PvP', 'Easy');
  }

  toggleMode() {
    this.refreshScoreboard();
    this.createGame(this.gameState()?.gameMode || 'PvP', this.gameState()?.difficulty || 'Easy');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleError(err: any) {
    console.error(err);
    let errorMsg = 'An error occurred';
    if (err && err.error instanceof ProgressEvent) {
        errorMsg = 'Network error: Cannot connect to .NET API on port 5033.';
    } else if (err && err.error && err.error.error) {
        errorMsg = err.error.error;
    } else if (err && typeof err.message === 'string') {
        errorMsg = err.message;
    }
    
    this.error.set(errorMsg);
    setTimeout(() => this.error.set(null), 3500);
    return throwError(() => new Error(errorMsg));
  }

  getGames() {
    return this.http.get<GameState[]>(`${this.apiUrl()}/games`).pipe(
        catchError(err => this.handleError(err))
    );
  }

  getGame(gameId: string) {
    this.http.get<GameState>(`${this.apiUrl()}/games/${gameId}`).pipe(
        catchError(err => this.handleError(err))
    ).subscribe(res => {
        this.gameState.set(res);
    });
  }

  getMoveHistory(gameId: string) {
    this.http.get<Move[]>(`${this.apiUrl()}/games/${gameId}/moves`).pipe(
        catchError(err => this.handleError(err))
    ).subscribe(res => {
        const state = this.gameState();
        if (state) {
            this.gameState.set({ ...state, moveHistory: res });
        }
    });
  }

  getMove(gameId: string, moveNumber: number) {
    return this.http.get<Move>(`${this.apiUrl()}/games/${gameId}/moves/${moveNumber}`).pipe(
        catchError(err => this.handleError(err))
    );
  }

  createGame(mode: GameMode, difficulty: Difficulty | null = 'Easy') {
    if (mode === 'PvP') difficulty = null;
    this.http.post<GameState>(`${this.apiUrl()}/games`, { mode, difficulty }).pipe(
        catchError(err => this.handleError(err))
    ).subscribe(res => {
      this.gameState.set(res);
      this.error.set(null); // clear network error if successful
    });
  }

  makeMove(row: number, col: number) {
    const state = this.gameState();
    if (!state) return;
    
    // UI bounds check optimistic
    if (state.status !== 'InProgress' || state.board[row][col] !== null) return;

    this.http.post<GameState>(`${this.apiUrl()}/games/${state.gameId}/moves`, { 
      player: state.currentPlayer, row, col 
    }).pipe(catchError(err => this.handleError(err)))
      .subscribe(res => {
         this.gameState.set(res);
         this.refreshScoreboard();
      });
  }

  undoMove() {
     const state = this.gameState();
     if (!state) return;
     this.http.post<GameState>(`${this.apiUrl()}/games/${state.gameId}/undo`, {}).pipe(
        catchError(err => this.handleError(err))
     ).subscribe(res => {
        this.gameState.set(res);
        this.refreshScoreboard();
     });
  }

  resetGame() {
    const state = this.gameState();
    if (!state) return;
    this.http.post<GameState>(`${this.apiUrl()}/games/${state.gameId}/reset`, {}).pipe(
        catchError(err => this.handleError(err))
    ).subscribe(res => {
        this.gameState.set(res);
    });
  }

  refreshScoreboard() {
     this.http.get<Scoreboard>(`${this.apiUrl()}/scoreboard`).pipe(
        catchError(err => this.handleError(err))
     ).subscribe(res => this.scoreboard.set(res));
  }

  resetScoreboard() {
     this.http.post<Scoreboard>(`${this.apiUrl()}/scoreboard/reset`, {}).pipe(
        catchError(err => this.handleError(err))
     ).subscribe(res => this.scoreboard.set(res));
  }
}
