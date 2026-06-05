using Microsoft.AspNetCore.Mvc;
using System;
using TicTacToe.Api.Models;
using TicTacToe.Api.Services;

namespace TicTacToe.Api.Controllers
{
    [ApiController]
    [Route("api")]
    public class GameController : ControllerBase
    {
        private readonly IGameService _gameService;

        public GameController(IGameService gameService)
        {
            _gameService = gameService;
        }

        [HttpPost("games")]
        public IActionResult CreateGame([FromBody] CreateGameRequest request)
        {
            try { return Ok(_gameService.CreateGame(request.Mode, request.Difficulty)); }
            catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
        }

        [HttpGet("games/{id}")]
        public IActionResult GetGame(string id)
        {
            try { return Ok(_gameService.GetGame(id)); }
            catch (Exception ex) { return NotFound(new { error = ex.Message }); }
        }

        [HttpPost("games/{id}/moves")]
        public IActionResult MakeMove(string id, [FromBody] MakeMoveRequest request)
        {
            try { return Ok(_gameService.MakeMove(id, request.Player, request.Row, request.Col)); }
            catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
        }

        [HttpPost("games/{id}/undo")]
        public IActionResult UndoMove(string id)
        {
            try { return Ok(_gameService.UndoMove(id)); }
            catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
        }

        [HttpPost("games/{id}/reset")]
        public IActionResult ResetGame(string id)
        {
            try { return Ok(_gameService.ResetGame(id)); }
            catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
        }

        [HttpGet("scoreboard")]
        public IActionResult GetScoreboard()
        {
            return Ok(_gameService.GetScoreboard());
        }

        [HttpPost("scoreboard/reset")]
        public IActionResult ResetScoreboard()
        {
            return Ok(_gameService.ResetScoreboard());
        }
    }
}
