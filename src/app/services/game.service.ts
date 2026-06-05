import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { GameState, GameMode, Scoreboard, Difficulty } from '../models/game';
import { MockEngineService } from './mock-engine.service';

@Injectable({providedIn: 'root'})
export class GameService {
  private http = inject(HttpClient);
  private mockEngine = inject(MockEngineService);

  public useMock = signal<boolean>(true);
  public apiUrl = signal<string>('http://localhost:5033/api');

  public gameState = signal<GameState | null>(null);
  public scoreboard = signal<Scoreboard | null>(null);
  public error = signal<string | null>(null);

  constructor() {
    this.refreshScoreboard();
    this.createGame('PvP', 'Hard');
  }

  toggleMode(useMock: boolean) {
    this.useMock.set(useMock);
    this.refreshScoreboard();
    this.createGame(this.gameState()?.gameMode || 'PvP', this.gameState()?.difficulty || 'Hard');
  }

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

  createGame(mode: GameMode, difficulty: Difficulty | null = 'Hard') {
    if (mode === 'PvP') difficulty = null;
    if (this.useMock()) {
       try {
           const state = this.mockEngine.createGame(mode, difficulty);
           this.gameState.set(state);
       } catch (e: any) { this.error.set(e.message); }
    } else {
       this.http.post<GameState>(`${this.apiUrl()}/games`, { mode, difficulty }).pipe(
           catchError(err => this.handleError(err))
       ).subscribe(res => {
         this.gameState.set(res);
         this.error.set(null); // clear network error if successful
       });
    }
  }

  makeMove(row: number, col: number) {
    const state = this.gameState();
    if (!state) return;
    
    // UI bounds check optimistic
    if (state.status !== 'InProgress' || state.board[row][col] !== null) return;

    if (this.useMock()) {
      try {
         const newState = this.mockEngine.makeMove(state.gameId, state.currentPlayer, row, col);
         this.gameState.set(newState);
         this.refreshScoreboard();
      } catch (e: any) { this.error.set(e.message); }
    } else {
      this.http.post<GameState>(`${this.apiUrl()}/games/${state.gameId}/moves`, { 
        player: state.currentPlayer, row, col 
      }).pipe(catchError(err => this.handleError(err)))
        .subscribe(res => {
           this.gameState.set(res);
           this.refreshScoreboard();
        });
    }
  }

  undoMove() {
     const state = this.gameState();
     if (!state) return;
     if (this.useMock()) {
        try {
           const newState = this.mockEngine.undoMove(state.gameId);
           this.gameState.set(newState);
           this.refreshScoreboard();
        } catch(e: any) { this.error.set(e.message); }
     } else {
        this.http.post<GameState>(`${this.apiUrl()}/games/${state.gameId}/undo`, {}).pipe(
           catchError(err => this.handleError(err))
        ).subscribe(res => {
           this.gameState.set(res);
           this.refreshScoreboard();
        });
     }
  }

  resetGame() {
    const state = this.gameState();
    if (!state) return;
    if (this.useMock()) {
       try {
          const newState = this.mockEngine.resetGame(state.gameId);
          this.gameState.set(newState);
       } catch(e: any) { this.error.set(e.message); }
    } else {
       this.http.post<GameState>(`${this.apiUrl()}/games/${state.gameId}/reset`, {}).pipe(
           catchError(err => this.handleError(err))
       ).subscribe(res => this.gameState.set(res));
    }
  }

  refreshScoreboard() {
     if (this.useMock()) {
        const score = this.mockEngine.getScoreboard();
        this.scoreboard.set(score);
     } else {
        this.http.get<Scoreboard>(`${this.apiUrl()}/scoreboard`).pipe(
           catchError(err => this.handleError(err))
        ).subscribe(res => this.scoreboard.set(res));
     }
  }

  resetScoreboard() {
     if (this.useMock()) {
        const score = this.mockEngine.resetScoreboard();
        this.scoreboard.set(score);
     } else {
        this.http.post<Scoreboard>(`${this.apiUrl()}/scoreboard/reset`, {}).pipe(
           catchError(err => this.handleError(err))
        ).subscribe(res => this.scoreboard.set(res));
     }
  }
}
