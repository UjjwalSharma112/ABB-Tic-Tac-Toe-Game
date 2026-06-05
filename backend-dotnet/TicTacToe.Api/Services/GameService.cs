using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using TicTacToe.Api.Models;

namespace TicTacToe.Api.Services
{
    public interface IGameService
    {
        GameState CreateGame(string mode, string? difficulty = "Hard");
        GameState GetGame(string id);
        GameState MakeMove(string id, string player, int row, int col);
        GameState UndoMove(string id);
        GameState ResetGame(string id);
        Scoreboard GetScoreboard();
        Scoreboard ResetScoreboard();
    }

    public class GameEngineService : IGameService
    {
        private readonly ConcurrentDictionary<string, GameState> _games = new();
        private Scoreboard _scoreboard = new();
        private readonly object _scoreLock = new();

        public GameState CreateGame(string mode, string? difficulty = "Hard")
        {
            if (string.Equals(mode, "PvP", StringComparison.OrdinalIgnoreCase)) mode = "PvP";
            else if (string.Equals(mode, "PvC", StringComparison.OrdinalIgnoreCase)) mode = "PvC";
            else throw new ArgumentException("Invalid game mode. Must be 'PvP' or 'PvC'.");

            if (mode == "PvC")
            {
                if (string.IsNullOrEmpty(difficulty)) throw new ArgumentException("Difficulty is required for PvC mode.");
                if (string.Equals(difficulty, "Easy", StringComparison.OrdinalIgnoreCase)) difficulty = "Easy";
                else if (string.Equals(difficulty, "Medium", StringComparison.OrdinalIgnoreCase)) difficulty = "Medium";
                else if (string.Equals(difficulty, "Hard", StringComparison.OrdinalIgnoreCase)) difficulty = "Hard";
                else throw new ArgumentException("Invalid difficulty. Must be 'Easy', 'Medium', or 'Hard'.");
            }
            else
            {
                difficulty = null;
            }

            var game = new GameState
            {
                GameId = Guid.NewGuid().ToString(),
                GameMode = mode,
                Difficulty = difficulty,
                CurrentPlayer = "X",
                Status = "InProgress",
                Board = new string?[3][]
                {
                    new string?[3] { null, null, null },
                    new string?[3] { null, null, null },
                    new string?[3] { null, null, null }
                }
            };
            _games[game.GameId] = game;
            return Duplicate(game);
        }

        public GameState GetGame(string id)
        {
            if (!_games.TryGetValue(id, out var game)) throw new Exception("Game not found");
            return Duplicate(game);
        }

        public GameState MakeMove(string id, string player, int row, int col)
        {
            if (!_games.TryGetValue(id, out var game)) throw new Exception("Game not found");
            lock (game)
            {
                if (game.Status != "InProgress") throw new Exception("Game already completed");
                if (game.CurrentPlayer != player) throw new Exception("Not your turn");
                if (row < 0 || row > 2 || col < 0 || col > 2) throw new Exception("Invalid position");
                if (game.Board[row][col] != null) throw new Exception("Cell occupied");

                game.Board[row][col] = player;
                game.MoveHistory.Add(new Move
                {
                    MoveNumber = game.MoveHistory.Count + 1,
                    Player = player,
                    Position = new Position { Row = row, Col = col },
                    Timestamp = DateTime.UtcNow
                });

                UpdateGameStatus(game);

                if (game.GameMode == "PvC" && game.Status == "InProgress" && game.CurrentPlayer == "O")
                {
                    MakeComputerMove(game);
                    UpdateGameStatus(game);
                }
                return Duplicate(game);
            }
        }

        public GameState UndoMove(string id)
        {
            if (!_games.TryGetValue(id, out var game)) throw new Exception("Game not found");
            lock (game)
            {
                if (game.MoveHistory.Count == 0) throw new Exception("No moves to undo");

                bool wasCompleted = game.Status != "InProgress";
                string? oldWinner = game.Winner;
                string oldStatus = game.Status;

                if (game.GameMode == "PvP")
                {
                    var lastMove = game.MoveHistory[^1];
                    game.MoveHistory.RemoveAt(game.MoveHistory.Count - 1);
                    game.Board[lastMove.Position.Row][lastMove.Position.Col] = null;
                    game.CurrentPlayer = lastMove.Player;
                }
                else
                {
                    var lastMove = game.MoveHistory[^1];
                    game.MoveHistory.RemoveAt(game.MoveHistory.Count - 1);
                    game.Board[lastMove.Position.Row][lastMove.Position.Col] = null;
                    game.CurrentPlayer = lastMove.Player;

                    if (lastMove.Player == "O" && game.MoveHistory.Count > 0)
                    {
                        var humanMove = game.MoveHistory[^1];
                        game.MoveHistory.RemoveAt(game.MoveHistory.Count - 1);
                        game.Board[humanMove.Position.Row][humanMove.Position.Col] = null;
                        game.CurrentPlayer = humanMove.Player;
                    }
                }

                game.Status = "InProgress";
                game.Winner = null;
                game.WinningCells.Clear();

                if (wasCompleted)
                {
                    lock (_scoreLock)
                    {
                        var stats = game.GameMode == "PvP" ? _scoreboard.PvP : _scoreboard.PvC;
                        if (oldStatus == "Won")
                        {
                            if (oldWinner == "X") stats.XWins--;
                            if (oldWinner == "O") stats.OWins--;
                        }
                        else if (oldStatus == "Draw")
                        {
                            stats.Draws--;
                        }
                    }
                }
                return Duplicate(game);
            }
        }

        public GameState ResetGame(string id)
        {
            if (!_games.TryGetValue(id, out var game)) throw new Exception("Game not found");
            lock (game)
            {
                game.Board = new string?[3][]
                {
                    new string?[3] { null, null, null },
                    new string?[3] { null, null, null },
                    new string?[3] { null, null, null }
                };
                game.CurrentPlayer = "X";
                game.Status = "InProgress";
                game.Winner = null;
                game.WinningCells.Clear();
                game.MoveHistory.Clear();
                return Duplicate(game);
            }
        }

        public Scoreboard GetScoreboard()
        {
            lock (_scoreLock)
            {
                return DuplicateScoreboard();
            }
        }

        public Scoreboard ResetScoreboard()
        {
            lock (_scoreLock)
            {
                _scoreboard = new Scoreboard();
                return DuplicateScoreboard();
            }
        }

        private void UpdateGameStatus(GameState game)
        {
            var win = CheckWin(game.Board);
            if (win != null)
            {
                game.Status = "Won";
                game.Winner = win.Value.player;
                game.WinningCells = win.Value.cells;
                lock (_scoreLock)
                {
                    var stats = game.GameMode == "PvP" ? _scoreboard.PvP : _scoreboard.PvC;
                    if (game.Winner == "X") stats.XWins++;
                    if (game.Winner == "O") stats.OWins++;
                }
            }
            else if (IsBoardFull(game.Board))
            {
                game.Status = "Draw";
                lock (_scoreLock)
                {
                    var stats = game.GameMode == "PvP" ? _scoreboard.PvP : _scoreboard.PvC;
                    stats.Draws++;
                }
            }
            else
            {
                game.CurrentPlayer = game.CurrentPlayer == "X" ? "O" : "X";
            }
        }

        private (string player, List<Position> cells)? CheckWin(string?[][] board)
        {
            for (int r = 0; r < 3; r++)
            {
                if (board[r][0] != null && board[r][0] == board[r][1] && board[r][1] == board[r][2])
                    return (board[r][0]!, new List<Position> { new() { Row = r, Col = 0 }, new() { Row = r, Col = 1 }, new() { Row = r, Col = 2 } });
            }
            for (int c = 0; c < 3; c++)
            {
                if (board[0][c] != null && board[0][c] == board[1][c] && board[1][c] == board[2][c])
                    return (board[0][c]!, new List<Position> { new() { Row = 0, Col = c }, new() { Row = 1, Col = c }, new() { Row = 2, Col = c } });
            }
            if (board[0][0] != null && board[0][0] == board[1][1] && board[1][1] == board[2][2])
                return (board[0][0]!, new List<Position> { new() { Row = 0, Col = 0 }, new() { Row = 1, Col = 1 }, new() { Row = 2, Col = 2 } });
            if (board[0][2] != null && board[0][2] == board[1][1] && board[1][1] == board[2][0])
                return (board[0][2]!, new List<Position> { new() { Row = 0, Col = 2 }, new() { Row = 1, Col = 1 }, new() { Row = 2, Col = 0 } });
            
            return null;
        }

        private bool IsBoardFull(string?[][] board) => board.All(row => row.All(cell => cell != null));

        private void MakeComputerMove(GameState game)
        {
            string player = "O", opponent = "X";
            var board = game.Board;

            if (game.Difficulty == "Easy")
            {
                MakeRandomMove(game, player);
                return;
            }

            if (game.Difficulty == "Medium")
            {
                var winM = FindWinningMove(board, player);
                if (winM != null) { ApplyComputerMove(game, player, winM.Row, winM.Col); return; }

                var blockM = FindWinningMove(board, opponent);
                if (blockM != null) { ApplyComputerMove(game, player, blockM.Row, blockM.Col); return; }

                MakeRandomMove(game, player);
                return;
            }

            var winMove = FindWinningMove(board, player);
            if (winMove != null) { ApplyComputerMove(game, player, winMove.Row, winMove.Col); return; }

            var blockMove = FindWinningMove(board, opponent);
            if (blockMove != null) { ApplyComputerMove(game, player, blockMove.Row, blockMove.Col); return; }

            if (board[1][1] == null) { ApplyComputerMove(game, player, 1, 1); return; }

            var corners = new List<Position> { new() { Row = 0, Col = 0 }, new() { Row = 0, Col = 2 }, new() { Row = 2, Col = 0 }, new() { Row = 2, Col = 2 } };
            foreach (var c in corners) if (board[c.Row][c.Col] == null) { ApplyComputerMove(game, player, c.Row, c.Col); return; }

            for (int r = 0; r < 3; r++)
                for (int c = 0; c < 3; c++)
                    if (board[r][c] == null) { ApplyComputerMove(game, player, r, c); return; }
        }

        private void MakeRandomMove(GameState game, string player)
        {
            var emptyCells = new List<Position>();
            for (int r = 0; r < 3; r++)
                for (int c = 0; c < 3; c++)
                    if (game.Board[r][c] == null) emptyCells.Add(new Position { Row = r, Col = c });

            if (emptyCells.Any())
            {
                var random = new Random();
                var move = emptyCells[random.Next(emptyCells.Count)];
                ApplyComputerMove(game, player, move.Row, move.Col);
            }
        }

        private Position? FindWinningMove(string?[][] board, string player)
        {
            for (int r = 0; r < 3; r++)
            {
                for (int c = 0; c < 3; c++)
                {
                    if (board[r][c] == null)
                    {
                        board[r][c] = player;
                        var win = CheckWin(board);
                        board[r][c] = null;
                        if (win != null) return new Position { Row = r, Col = c };
                    }
                }
            }
            return null;
        }

        private void ApplyComputerMove(GameState game, string player, int row, int col)
        {
            game.Board[row][col] = player;
            game.MoveHistory.Add(new Move
            {
                MoveNumber = game.MoveHistory.Count + 1,
                Player = player,
                Position = new Position { Row = row, Col = col },
                Timestamp = DateTime.UtcNow
            });
        }

        private GameState Duplicate(GameState src)
        {
            return new GameState
            {
                GameId = src.GameId,
                Board = src.Board.Select(row => row.ToArray()).ToArray(),
                CurrentPlayer = src.CurrentPlayer,
                GameMode = src.GameMode,
                Difficulty = src.Difficulty,
                Status = src.Status,
                Winner = src.Winner,
                WinningCells = src.WinningCells.Select(c => new Position { Row = c.Row, Col = c.Col }).ToList(),
                MoveHistory = src.MoveHistory.Select(m => new Move { MoveNumber = m.MoveNumber, Player = m.Player, Position = new Position { Row = m.Position.Row, Col = m.Position.Col }, Timestamp = m.Timestamp }).ToList()
            };
        }

        private Scoreboard DuplicateScoreboard()
        {
            return new Scoreboard
            {
                PvP = new ScoreStats { XWins = _scoreboard.PvP.XWins, OWins = _scoreboard.PvP.OWins, Draws = _scoreboard.PvP.Draws },
                PvC = new ScoreStats { XWins = _scoreboard.PvC.XWins, OWins = _scoreboard.PvC.OWins, Draws = _scoreboard.PvC.Draws }
            };
        }
    }
}
