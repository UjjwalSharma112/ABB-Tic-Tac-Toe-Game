using System;
using System.Collections.Generic;

namespace TicTacToe.Api.Models
{
    public class Position
    {
        public int Row { get; set; }
        public int Col { get; set; }
    }

    public class Move
    {
        public int MoveNumber { get; set; }
        public string Player { get; set; } = string.Empty;
        public Position Position { get; set; } = new();
        public DateTime Timestamp { get; set; }
    }

    public class GameState
    {
        public string GameId { get; set; } = string.Empty;
        public string?[][] Board { get; set; } = Array.Empty<string?[]>();
        public string CurrentPlayer { get; set; } = string.Empty;
        public string GameMode { get; set; } = string.Empty;
        public string? Difficulty { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Winner { get; set; }
        public List<Position> WinningCells { get; set; } = new();
        public List<Move> MoveHistory { get; set; } = new();
    }

    public class ScoreStats
    {
        public int XWins { get; set; }
        public int OWins { get; set; }
        public int Draws { get; set; }
    }

    public class Scoreboard
    {
        public ScoreStats PvP { get; set; } = new();
        public ScoreStats PvC { get; set; } = new();
    }

    public class CreateGameRequest
    {
        public string Mode { get; set; } = "PvP";
        public string? Difficulty { get; set; }
    }

    public class MakeMoveRequest
    {
        public string Player { get; set; } = string.Empty;
        public int Row { get; set; }
        public int Col { get; set; }
    }
}
