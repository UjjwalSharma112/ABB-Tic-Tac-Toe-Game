# ABB Tic Tac Toe Enterprise

A fully-featured, enterprise-grade Tic Tac Toe application demonstrating modern full-stack web development patterns, built with Angular 18 (Strict Mode, Zoneless) and an ASP.NET Core 8 Web API.

- **GitHub Repo Address**: [https://github.com/UjjwalSharma112/ABB-Tic-Tac-Toe-Game](https://github.com/UjjwalSharma112/ABB-Tic-Tac-Toe-Game)
- **Live Demo URL**: [https://ais-pre-q6tw5dw7fbevn5e6nbntt3-518757711428.asia-east1.run.app](https://ais-pre-q6tw5dw7fbevn5e6nbntt3-518757711428.asia-east1.run.app)
- **Backend Port**: `http://localhost:5033`
- **Frontend Port**: `http://localhost:3000`
- **Swagger UI Port**: `http://localhost:5033/swagger`

## 1. Project Overview
This application provides a browser-based Tic Tac Toe environment designed to be highly interactive and robust. It highlights advanced state management capabilities across an Angular client interacting with a secure, thread-safe .NET backend. Users can compete locally in Player vs. Player mode, or face off against an adjustable Computer opponent. It accurately synchronizes move histories, calculates chronological state restorations (undo moves), and persists session scoreboards.

## 2. Tech Stack
- **Frontend Architecture**: Angular 18 (Strict Mode, Zoneless Signals framework), TypeScript
- **Styling**: Tailwind CSS (with arbitrary values enforcing structural design constraints)
- **Backend Architecture**: ASP.NET Core 8 Web API, C# 12
- **Data Storage**: In-Memory Domain Storage via `ConcurrentDictionary` ensuring concurrent thread-safety.
- **Backend Testing**: xUnit (Unit Test Suite)
- **Source Control**: GitHub

## 3. Features Implemented
- **Game Modes**: Two Player Mode (PvP) and Computer Mode (PvC).
- **Intelligent CPU**: Three AI difficulty algorithms for the computer opponent: Easy (Randomizer computation), Medium (Heuristic Win/Block analyzer), and Hard (Minimax logic approach defaults).
- **Core Game Logic**: Comprehensive detection of board outcomes including horizontal, vertical, and diagonal win detection pathways.
- **Undo Navigation Engine (Option B Implementation)**: 
  - Restores the entire session sequence logically.
  - In PvC mode, reversing removes both the Computer's counter-move and the leading Human move chronologically.
  - Automatically recalculates scoreboard metrics if an opponent reverses from a completed terminal game state.
- **Session Scoreboard**: Decoupled persistent scoreboard isolating metrics between game modes.
- **Move History Log**: Full logging module detailing the player coordinates, precise timing stamps, and execution order for audit trailing.

## 4. Prerequisites to start in local
- **Node.js**: LTS version (18.x or newer) installed globally.
- **.NET SDK**: 8.0 SDK installed globally.
- **Git**: Source control for cloning the repository.

## 5. Step by step clone and Run

### Step 1: Clone the repository
Launch a terminal and execute the following commands:
```bash
git clone https://github.com/UjjwalSharma112/ABB-Tic-Tac-Toe-Game.git
cd ABB-Tic-Tac-Toe-Game
```

### Step 2: Start the Backend (.NET API)
1. Traverse into the backend application working directory:
   ```bash
   cd backend-dotnet/TicTacToe.Api
   ```
2. Restore dependencies and bootstrap the API service:
   ```bash
   dotnet run
   ```
- **Backend Port Address**: Native HTTP layer allocates directly onto `http://localhost:5033`.
- **Swagger Documentation**: Native endpoints diagnostic UI available at `http://localhost:5033/swagger`.

### Step 3: Start the Frontend (Angular)
1. Open a new terminal session organically bound to the root application structure.
2. Install NPM packages:
   ```bash
   npm install
   ```
3. Boot the Angular CLI Hot-Reload Dev Server:
   ```bash
   npm start
   ```
- **Frontend Port Address**: Access the deployed browser interface at `http://localhost:3000`.
   
## 6. API Endpoint Summary
- `POST /api/games` - Provision a new active game session state. Form payload targets Game Modes.
- `GET /api/games/{id}` - Fetch a specific immutable game snapshot tracking active progressions.
- `POST /api/games/{id}/moves` - Mutate coordinates for an individual session participant (Client Payload).
- `POST /api/games/{id}/undo` - Fire an action logic recalculating preceding states dynamically.
- `POST /api/games/{id}/reset` - Rebuild the active board grid mapping.
- `GET /api/scoreboard` - Scrape the complete telemetry statistics table.
- `POST /api/scoreboard/reset` - Truncate persistent history and flush active scoreboard objects.

## 7. How to run tests
The backend integration incorporates comprehensive automated unit tests covering structural business logic parameters (board state processing, validation rule chains).
1. Navigate to the targeted `.NET` test assembly suite:
   ```bash
   cd backend-dotnet/TicTacToe.Tests
   ```
2. Initiate exactly executing logic pipelines via the .NET test runner:
   ```bash
   dotnet test
   ```

## 8. AI Tools and Prompt Summary
**AI Facilitation Methodologies**: Built collaboratively using AI-assisted pair programming paradigms (specifically leveraging large context-window models like Gemini 1.5 Pro). To maximize code quality and architectural soundness, the interaction followed strict systemic prompting and contextual grounding techniques akin to practices established by seasoned Prompt Engineers.

**Core Prompt Engineering Directives Used**:
1. *Context Setting & Persona Strategy*:
   > "Act as a Principle Systems Architect with deep expertise in .NET 8 (C# 12) and Angular 18 (Strict Mode, Zoneless). Your objective is to scaffold a production-grade Tic Tac Toe backend utilizing a `ConcurrentDictionary` for thread-safe ephemeral storage. The API must adhere to RESTful constraints, returning clean JSON payloads summarizing the explicit state, active turn orientations, and deeply calculated win-condition validations in O(1) or O(n) complexities. Emphasize immutability within the data contracts."
2. *Complex Logic Constraint Prompting (Undo/Scoreboard)*:
   > "Implement the 'Undo' feature adapting to 'Option B' specifications (Undo is allowed after completion). You must enforce a state-rollback pipeline. If the `GameMode` is 'PvC', traversing back gracefully purges both the immediate CPU automated counter-move and the previous human action within an inclusive atomic rollback transaction. Moreover, if the game was previously recorded as a Win or Draw in the scoreboard metric repository, dynamically deduct that previous terminal state from the persistent `Scoreboard` entity sequentially without decoupling."
3. *Algorithmic Routing Directive (Computer Opponent Options)*:
   > "Design an intelligent agent service orchestrating computer actions based on an adjustable 'Difficulty' parameter (Easy, Medium, Hard). Construct a heuristic chain: Easy triggers pure random available-cell selection; Medium prioritizes immediate-win executions and opponent-blocking maneuvers before falling back to random; Hard leverages a robust logic configuration prioritizing center acquisition, corner optimization, and unforced error minimization."
4. *Component UI Design Instruction (Zero-Dependency Styling)*:
   > "Develop a modern responsive interface representing the game grid utilizing purely utility-based Tailwind CSS classes (version 4.0 paradigms) integrated via Angular 18 `@if`/`@for` control flow blocks. Specifically avoid legacy `NgModules` or extraneous UI libraries. Utilize `signals` strictly for reactive template bindings tracking the `GameState`. Ensure specific visual feedback indicators: winning coordinate overlays must pulse, current turn indicators must clearly highlight, and difficulty switches should seamlessly toggle."

## 9. Design Decisions
- **Angular 18 Zoneless Standard Implementation**: Emphasized granular re-rendering flows omitting implicit `Zone.js` dependencies fundamentally transitioning towards pure localized atomic reactivity patterns by exclusively applying generic `Signal` concepts on service states.
- **Option B Architecture for Rollbacks**: Handled scoreboard metrics explicitly by allowing board mutability specifically enabling state engines capable of deducting prior completions recursively on undo requests.
- **Thread-Safety Persistence Frameworks**: Minimized disk input/output blocking variables safely via robust memory mechanisms specifically encapsulating the concurrent dictionary interfaces coupled with rigid lock contexts specifically during localized concurrent mutation routines.

## 10. Clarifications and Assumptions
- *Assumption*: To adhere strictly toward providing immediate in-memory storage, game processes dynamically reside within active runtime RAM. Reallocating or terminating the Web API daemon inherently effectively cleans all data traces organically. 
- *Clarification*: Implementing the Undo methodology when within Computer simulated mode targets atomic event transactions sequentially pulling the leading calculated response combined with preceding player interaction to retain optimal turn orientation configurations.

## 11. Known Limitations
- Application audit trail telemetry logging incorporates universal UTC ISO 8601 structuring schemas. Processing exact native zone specific local chronological translations is fundamentally relegated entirely to active client-side visual display logic loops.
- Emphasizing In-Memory data handling inherently bypasses standard horizontal computing redundancies scaling capabilities preventing dynamic instance clustering.

## 12. Future Improvements
- Upgrade persistent memory architectures towards relational structural foundations via Entity Framework Core connecting toward scalable infrastructure endpoints (e.g., SQLite or fully hosted PostgreSQL databases).
- Supercharging synchronous operations asynchronously using streaming WebSocket interfaces like standard SignalR structures generating reactive remote peer-to-peer configurations natively within the board view porting.
