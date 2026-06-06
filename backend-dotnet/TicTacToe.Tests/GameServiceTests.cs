using TicTacToe.Api.Models;
using TicTacToe.Api.Services;
using Xunit;

namespace TicTacToe.Tests;

public class GameServiceTests
{
    private readonly GameEngineService _service;

    public GameServiceTests()
    {
        _service = new GameEngineService();
    }

    [Fact]
    public void CreateGame_ShouldInitializeEmptyBoard()
    {
        var game = _service.CreateGame("PvP");
        Assert.NotNull(game.GameId);
        Assert.Equal("PvP", game.GameMode);
        Assert.Equal("InProgress", game.Status);
        Assert.Equal("X", game.CurrentPlayer);
    }

    [Fact]
    public void MakeMove_ValidMove_ShouldUpdateBoard()
    {
        var game = _service.CreateGame("PvP");
        game = _service.MakeMove(game.GameId, "X", 0, 0);

        Assert.Equal("X", game.Board[0][0]);
        Assert.Equal("O", game.CurrentPlayer);
        Assert.Single(game.MoveHistory);
    }

    [Fact]
    public void MakeMove_WinCondition_ShouldSetWinner()
    {
        var game = _service.CreateGame("PvP");
        _service.MakeMove(game.GameId, "X", 0, 0);
        _service.MakeMove(game.GameId, "O", 1, 0);
        _service.MakeMove(game.GameId, "X", 0, 1);
        _service.MakeMove(game.GameId, "O", 1, 1);
        game = _service.MakeMove(game.GameId, "X", 0, 2); // X wins

        Assert.Equal("Won", game.Status);
        Assert.Equal("X", game.Winner);
        
        var scoreboard = _service.GetScoreboard();
        Assert.Equal(1, scoreboard.PvP.XWins);
    }

    [Fact]
    public void UndoMove_PvP_ShouldRemoveMostRecentMoveAndResetWinner()
    {
        var game = _service.CreateGame("PvP");
        _service.MakeMove(game.GameId, "X", 0, 0);
        _service.MakeMove(game.GameId, "O", 1, 0);
        
        var undoneGame = _service.UndoMove(game.GameId);
        
        Assert.Equal("O", undoneGame.CurrentPlayer);
        Assert.Null(undoneGame.Board[1][0]);
        Assert.Single(undoneGame.MoveHistory);
        Assert.False(undoneGame.CanUndo);
    }

    [Fact]
    public void UndoMove_PvC_ShouldRemoveBothMoves()
    {
        var game = _service.CreateGame("PvC", "Medium"); // X plays, then O plays automatically
        _service.MakeMove(game.GameId, "X", 0, 0);
        
        var undoneGame = _service.UndoMove(game.GameId);
        
        Assert.Equal("X", undoneGame.CurrentPlayer);
        Assert.Null(undoneGame.Board[0][0]);
        Assert.Empty(undoneGame.MoveHistory);
        Assert.False(undoneGame.CanUndo);
    }
}
