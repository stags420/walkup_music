## Lineup Export/Import and Batter Stats — Plan, Design, and Tasks

### Objectives
- Enable exporting the current batting lineup as shareable text that can also be re-imported on another device.
- Add fast, low-friction batter stat collection that fits the game flow (advance batter immediately; log outcome quickly now or later).
- Allow viewing past games and exporting cumulative batter statistics (per game or multi-game selection) in standard baseball stat formats.

### Non-goals
- No inning/outs tracking UI. We will infer stats from plate appearance outcomes only.
- No defensive or pitching stats.
- No live syncing between devices (sharing is via export/import text).

### Key UX Principles
- Immediate flow: advancing to the next batter must be instant.
- One-tap common outcomes; anything else can be logged later from a backlog.
- Mobile-first: large touch targets; support native share (Web Share API) with clipboard fallback.
- Clear affordances to review and correct outcomes post-play.
- Fast correction: a single-tap Undo for the last advance/outcome.
 - Simple deferral without a queue: log via an "Enter stats" button before advancing, or use a Back button to update the prior batter if you missed it.

### User Stories
- As a coach, I can export my lineup as text and share it; on another device I can import that text to load the same lineup.
- As a scorekeeper, when an at-bat ends I can instantly advance to the next batter and optionally log the outcome with one tap.
- As a scorekeeper, I can revisit unlogged at-bats and enter outcomes later.
- As a user, I can browse past games and see each player’s stat line for a game.
- As a user, I can export stats for one or more games as CSV with common baseball batter metrics.

### High-level Feature Overview
- Lineup export/import: human-readable text with an embedded machine-parsable payload; import recognizes and rebuilds the lineup.
- Game sessions: start game with a lineup snapshot; record plate appearances by batter with quick outcomes and optional details (RBI, notes).
 - Deferred logging via Back: if you advance without logging, you can press Back to the previous batter and enter the outcome (no separate pending drawer).
- Stats aggregation: compute AB, PA, H, 1B, 2B, 3B, HR, R, RBI, BB, HBP, SO, SB, CS, SF, SH, AVG, OBP, SLG, OPS.
- Past games: list, view, rename, delete.
- Export stats: CSV per game or across selected games; optional per-player and per-game breakdown.

### Game Flow
1) Create a game from the current lineup (snapshot is stored on start).
2) For each batter’s turn:
   - Tap “Next batter” immediately to continue play.
   - Optionally, tap “Enter stats” to open the quick outcome pad and log the result now (H, BB, K, OUT, HBP, HR). For outcomes needing detail (RBI count, bases), choose chips 0–4, 1–4, etc.
   - If you advanced without logging, press “Back” to go to the previous batter and enter the outcome.
3) After the game, review stats on the game detail screen and optionally export CSV.
4) At any time, single-tap Undo to revert the last advance or last outcome entry.

### Data Model
We will extend the game module with persistent game/session and plate appearance records. Stored locally (same storage approach as existing stores), exportable.

```ts
// New models in modules/game/models/
export type PlateAppearanceOutcome =
  | 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'HOMERUN'
  | 'WALK' | 'INTENTIONAL_WALK' | 'HBP'
  | 'STRIKEOUT_SWINGING' | 'STRIKEOUT_LOOKING'
  | 'GROUND_OUT' | 'FLY_OUT' | 'LINE_OUT' | 'POP_OUT'
  | 'FIELDERS_CHOICE' | 'REACHED_ON_ERROR'
  | 'SAC_FLY' | 'SAC_BUNT'
  | 'CATCHERS_INTERFERENCE' // PA only, no AB
  | 'OTHER_NO_AB'; // PA only, no AB

export interface PlateAppearance {
  id: string;
  batterId: string;
  outcome?: PlateAppearanceOutcome; // undefined until logged
  bases?: 1 | 2 | 3 | 4; // if outcome is a hit; HR implies 4
  rbis: number; // 0–4
  notes?: string;
  timestamp: number;
  // Optional quick toggles not tied to innings
  scoredRun?: boolean; // batter later scored
  stolenBases?: number; // 0+
  caughtStealing?: number; // 0+
  loggedAt?: number; // when outcome was recorded
}

export interface GameRecord {
  id: string;
  startedAt: number;
  name?: string; // Opponent or label
  lineupPlayerIds: string[]; // snapshot order used for the game
  plateAppearances: PlateAppearance[];
  substitutions?: Array<{ timestamp: number; outPlayerId: string; inPlayerId: string; positionIndex?: number }>; // optional
  // Optional summary fields users can edit
  teamRuns?: number;
  opponentRuns?: number;
}
```

Derived stats mapping (batter):
- PA: count of all plate appearances
- AB: PA minus (WALK, INTENTIONAL_WALK, HBP, SAC_FLY, SAC_BUNT)
- H: count of (SINGLE, DOUBLE, TRIPLE, HOMERUN)
- 1B, 2B, 3B, HR: outcome counts
- BB: WALK + INTENTIONAL_WALK (and track IBB separately if desired)
- HBP, SO: strikeout outcomes
- SF, SH: sacrifices
 - ROE: REACHED_ON_ERROR (does not count as hit; counts as AB)
- FC: FIELDERS_CHOICE (counts as AB)
- R: sum of `scoredRun` toggles per batter
- SB, CS: from toggles
- AVG = H / AB (guard division by 0)
- OBP = (H + BB + HBP) / (AB + BB + HBP + SF)
- SLG = (1B + 2×2B + 3×3B + 4×HR) / AB
- OPS = OBP + SLG
 - Interference/Other (no AB): counts as PA only, excluded from AB and from OBP numerator/denominator.

### Storage and State
 - New store `gamesStore` in `modules/game/state/gamesStore.ts` using the same pattern as `lineupStore`/`playersStore` (likely Zustand). Methods: createGameFromCurrentLineup, advanceToNextBatter (create unlogged PA), logOutcomeForPreviousBatter, updateGameMeta, listGames, deleteGame, getUnloggedCount.
 - Deferred logging uses unlogged plate appearances (no separate queue). On advance, we create a PA with `outcome` unset; Back navigates to the prior unlogged PA to complete it.
- Import/export utilities:
  - Lineup: convert current lineup to a shareable text format with embedded payload.
  - Stats CSV: generate CSV string for selected game IDs.

Persistence details:
- Local-only persistence through existing store mechanism (same backing as `playersStore` and `lineupStore`).
- Introduce a lightweight storage version for game records: `{ schemaVersion: 1 }` stored alongside games to allow future migrations.
- IDs are UUID v4 strings; timestamps are epoch millis.

### Lineup Export/Import Format
Constraints: must be human-readable, and also reliably re-importable.

Human-readable header + machine payload block:

Example share text (v1):
```
WalkUp Music — Lineup (v1)

1) Alice
2) Bob
3) Charlie
4) Dana

Import code:
WALKUP-LINEUP-v1:eyJwbGF5ZXJzIjpbeyJpZCI6IjEiLCJuYW1lIjoiQWxpY2UifSx7ImlkIjoiMiIsIm5hbWUiOiJCb2IifSx7ImlkIjoiMyIsIm5hbWUiOiJDaGFybGllIn0seyJpZCI6IjQiLCJuYW1lIjoiRGFuYSJ9XX0=
```

- The `WALKUP-LINEUP-v1:` suffix is followed by base64-encoded JSON containing: player name list in order, and if available, UUIDs.
- Import supports:
  - If a player name matches an existing player (case-insensitive), reuse that player ID.
  - Otherwise, create a new player.
  - Rebuild lineup order accordingly.
- Share via `navigator.share` when available; otherwise copy to clipboard and show a toast with a “View/Copy” option.

Import preview and mapping:
- Paste/import flow shows a preview: ordered list of incoming players and how they will map to existing roster (match by case-insensitive name).
- Conflicts are highlighted (e.g., duplicate player names). User can proceed or cancel.

### Stats Export Format (CSV)
Columns (per player, per selection):
- player_name, games, PA, AB, H, 1B, 2B, 3B, HR, R, RBI, BB, IBB, HBP, SO, SB, CS, SF, SH, AVG, OBP, SLG, OPS
- Options:
  - Export “All selected games combined” (cumulative) and/or “Per-game breakdown” (one row per player per game).
  - Include game label/date when exporting per-game rows.

CSV specification:
- RFC 4180 compliant: comma as delimiter, CRLF newlines, double-quote fields that contain commas/quotes/newlines, escape embedded quotes by doubling them.
- Header row always included.

### UI Additions and Changes
  - Batting view (`GameMode.tsx` / `CurrentBatterDisplay.tsx`):
   - Primary action: Next batter (unchanged behavior speed-wise).
   - “Enter stats” opens Outcome Quick Pad with first-class buttons: H, HR, BB, K, OUT, HBP; an “Other” button reveals less common outcomes (e.g., FC, ROE, SF, SH, IBB, K-looking vs K-swinging detail, LINE OUT, POP OUT).
   - Conditional details appear after outcome selection:
     - If H: show Bases 1–4 (HR defaults to 4) and RBI chips 0–4 (default 0).
     - If OUT via Other (e.g., SF, FC, ROE): show RBI chips 0–4.
     - If K/BB/HBP: hide RBI by default; allow optional “Advanced” toggle to reveal RBI if needed.
   - Back button goes to the previous batter to fill in an unlogged at-bat.
   - Small indicator of unlogged count (badge) may appear in the header, but no separate pending drawer.
   - One-tap Undo to revert last advance or last logged outcome.

- Past games:
  - New `GameList` page: cards with date, name, PA count, unlogged count, optional score fields.
  - `GameDetail` page: lineup snapshot display, plate appearance log, per-player stat line for that game, ability to fix outcomes.

- Player card enhancements:
  - In `PlayerCard.tsx` and `CurrentBatterDisplay.tsx`, show prior at-bat outcomes for the player during the current game (e.g., last 3 outcomes) as compact chips/icons.

- Team runs display:
  - Show “Team Runs” total in the game header, computed from `scoredRun` toggles across PAs. Allow manual edit in game meta if desired.

 - Export/Import:
  - In `BattingOrderManager.tsx`: add “Export lineup” (share/copy) and “Import lineup” (paste/import dialog with validation + preview).
  - In `GameDetail` and a new “Stats” page: “Export CSV” (single game or multi-select picker UI).

- Navigation:
  - Update `NavBar.tsx` to add entries for “Games” and optionally “Stats” (or integrate into existing menu).
  - Add routes for `GameList`, `GameDetail`, and “Stats” export page.

- Lineup changes mid-game (MVP scope):
  - Allow reordering or substituting players in the game’s lineup snapshot. Subsequent turns use the updated order. Stats remain tied to player IDs, not positions.
  - Do not track advanced substitution semantics (e.g., pinch-hits attribution beyond batter ID). Optional substitution log stored for audit.

Accessibility and ergonomics:
- Large, high-contrast buttons; support keyboard shortcuts where applicable.
- Undo/snackbar after logging an outcome.

### Validation and Edge Cases
- Import text may be edited by users; validate prefix and payload; show clear errors.
- Duplicate names: keep order, generate new players; later allow manual merge by user (out of scope for MVP).
- Offline only: no external services required; large text payloads must still fit clipboard/share limits (the encoded payload is small for typical lineups).
- Stats division by zero guarded; display “—” when N/A.
- Undo safety: only the last irreversible operation (advance or log) is undoable; display a brief snackbar with Undo action.
 - Unlogged at-bats: exporting stats excludes unlogged plate appearances and surfaces a warning badge with count until resolved.

### Security/Privacy
- All data local to device unless user explicitly shares text/CSV.
- No PII beyond player names already in app.

### Testing Strategy
- Unit: stats aggregation from plate appearances; import/export parsers; CSV generator.
  - Component: quick outcome overlay; Back/Undo UX; Other outcomes sheet; conditional fields visibility; lineup export/import buttons; player card prior-AB chips.
- E2E: 
  - Create lineup → export → import on fresh session → lineup matches.
  - Run a game with a mix of immediate logs and deferrals (advance first, Back to enter) → stats match expected.
  - Export CSV for one and multiple games → verify columns and numbers.
- Performance: ensure quick outcome overlay interaction time < 16ms per tap and “Next batter” remains instant subjectively (no jank in DevTools performance profile on mid-range device).

### Incremental Delivery Plan (Milestones)
1) Lineup export/import
   - Export text generation, share/copy
   - Import dialog, validation, preview/mapping UI, and rebuild lineup
2) Game session + deferred logging (no queue)
   - New `gamesStore`; create game from current lineup
   - Quick outcome overlay; advance batter creates unlogged PA; Back to previous batter to fill; Undo last action
3) Stats aggregation
   - Derived stats utilities; per-player/game stat lines
4) Past games UI
   - List/detail pages; edit game name/score; fix outcomes
5) Stats export (CSV)
   - Per-game and multi-game export; download/share/copy
6) Polish and tests
   - A11y, error states, E2E/tests passing

### Detailed Task Breakdown (user stories with acceptance criteria)

- As a coach, I want to export my lineup as shareable text so that I can reuse it on another device.
  - Acceptance criteria:
    - Button in `BattingOrderManager.tsx` generates share text with `WALKUP-LINEUP-v1` block.
    - Uses Web Share API when available; clipboard fallback with toast.
    - Unit tests validate encoding and human-readable section presence.
  - Notes: Include player names and IDs where available; keep payload small.

- As a coach, I want to import a lineup from shared text so that I don’t have to re-enter it.
  - Acceptance criteria:
    - Import dialog accepts pasted text, validates prefix, decodes payload.
    - Preview shows mapping to existing players (case-insensitive by name) and highlights duplicates/new players.
    - Applying import rebuilds lineup order; errors do not alter existing data.
    - Unit tests cover success, invalid payload, duplicate names, and empty input.
  - Notes: Base64 JSON payload; future-proof via version key.

- As a scorekeeper, I want to start a game from my current lineup so that we can record at-bats.
  - Acceptance criteria:
    - Create game action snapshots lineup to `GameRecord.lineupPlayerIds`.
    - Navigation to game screen reflects current batter and order.
    - Game list shows the new game with date and PA count 0.
    - Unit tests verify snapshot and ID/timestamp creation.

- As a scorekeeper, I want to advance instantly to the next batter so that play continues without delay.
  - Acceptance criteria:
    - Next advances order immediately and creates an unlogged `PlateAppearance` for the batter.
    - Interaction is jank-free; Undo reverts the advance.
    - Component test validates instant advance and Undo.
  - Notes: Use store action `advanceToNextBatter` and last-action stack for Undo.

- As a scorekeeper, I want an Enter Stats button so that I can quickly log outcomes when I have time.
  - Acceptance criteria:
    - Enter Stats opens `OutcomeQuickPad` with H, BB, K, OUT, HBP, HR (+ bases for H).
    - RBI chips available where applicable (0–4), default 0.
    - Logging sets `outcome`, `bases` (if applicable), `rbis`, `loggedAt` on the last unlogged PA.
    - Component tests cover typical outcomes and base/rbi chips.

- As a scorekeeper, I want a Back button so that I can fill in the prior batter’s outcome if I advanced too fast.
  - Acceptance criteria:
    - Back navigates to previous batter and selects the most recent unlogged PA.
    - Logging then associates with that PA and returns to current batter position.
    - Component test covers advance → Back → log → return.

- As a coach, I want to see prior at-bat results on the player card so that I can track a player’s performance in-game.
  - Acceptance criteria:
    - Player card shows last 3 outcomes for current game as chips/icons (e.g., 1B, BB, K).
    - Component test validates correct chip rendering and order.

- As a coach, I want to see total team runs so that I know our score.
  - Acceptance criteria:
    - Game header displays team runs computed from `scoredRun` toggles on PAs.
    - Optional manual edit of team runs in game meta.
    - Component test validates computed runs and manual override.

- As a user, I want to view past games so that I can review stats later.
  - Acceptance criteria:
    - `GameList` displays games with date, name, PA count, and unlogged count badge.
    - `GameDetail` shows lineup snapshot, PA log, per-player stat line, and allows fixing outcomes.
    - Component tests cover list rendering and detail stats correctness for a sample game.

- As a user, I want accurate baseball batter statistics so that I can evaluate performance.
  - Acceptance criteria:
    - Stats include PA, AB, H, 1B, 2B, 3B, HR, R, RBI, BB, IBB, HBP, SO, SB, CS, SF, SH, AVG, OBP, SLG, OPS.
    - Interference/Other (no AB) outcomes count in PA but not AB; OBP/SLG treat them as plate appearances without on-base credit.
    - Unit tests exercise aggregation across mixed outcomes.
  - Notes: See data model section for specific mappings and formulas.

- As a user, I want to export stats as CSV so that I can share or analyze them.
  - Acceptance criteria:
    - Export one or multiple games; choose cumulative vs per-game breakdown.
    - CSV is RFC 4180 compliant with headers; opens correctly in Excel/Sheets.
    - Unit tests verify escaping and representative rows.

- As a maintainer, I want migrations/versioning so that future data shape changes don’t break existing installs.
  - Acceptance criteria:
    - Schema version is tracked; initial version set to 1.
    - Migration hook is called on load; no-op for v1.
    - Unit test validates version persistence and safe load.

Definition of Done (each task):
- tests green
- lint clean
- docs updated
- e2e happy path passes
- no TODOs left

### Acceptance Criteria (MVP)
- Lineup export produces text with `WALKUP-LINEUP-v1` block; importing that text reconstructs the lineup order with names.
- While in game mode, advancing to next batter is as fast as current; logging an outcome is one tap for common cases.
 - User can defer logging without a queue: advance first, then press Back to enter the prior batter’s outcome.
- Past games list shows created games; detail shows lineup snapshot and per-player stat line.
- CSV export includes standard columns and correct aggregates for selected games.
- All new logic has unit tests; new flows covered by component tests; E2E happy path passes.
- Import flow shows a preview/mapping and handles duplicates; invalid payloads produce a user-friendly error without changing data.
- Undo last action is available and works for both “advance batter” and “log outcome.”
- Data persists across reloads; no data loss when navigating around the app.
- CSV adheres to RFC 4180 (verified by unit tests) and opens correctly in common spreadsheet apps.
 - Player cards show prior at-bat results during a game.
 - Team runs total is displayed in the game header and updates as `scoredRun` toggles are set; can be edited in game meta if needed.

### Risks and Mitigations
- Outcome complexity vs. speed: keep quick pad minimal; advanced options behind “More outcomes.”
- Runs/SB/CS without inning context: allow quick toggles and explain in help that these are per-game totals not tied to specific innings.
- User error on import: strong validation and preview before applying.

### Open Questions
- Do we need to support additional advanced outcomes (e.g., interference, catcher’s interference)? If so, extend enum later without breaking v1 imports.
- Should we include a compact URL-style share link in addition to text? (Nice-to-have; out of scope for MVP.)


