import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { PlayerManagementPage } from '../pages/PlayerManagementPage';
import { LineupManagementPage } from '../pages/LineupManagementPage';
import { GameModePage } from '../pages/GameModePage';
import { testPlayers } from '../fixtures/testData';
import { testMockTracks } from '../fixtures/mockTracks';

test.describe('Complete E2E Workflow', () => {
  let loginPage: LoginPage;
  let playerPage: PlayerManagementPage;
  let lineupPage: LineupManagementPage;
  let gamePage: GameModePage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    playerPage = new PlayerManagementPage(page);
    lineupPage = new LineupManagementPage(page);
    gamePage = new GameModePage(page);

    // Inject mock tracks before the app starts
    await page.addInitScript((mockTracks) => {
      // Store mock tracks in window object so they can be accessed by the app
      (
        globalThis as typeof globalThis & { __TEST_MOCK_TRACKS__?: unknown }
      ).__TEST_MOCK_TRACKS__ = mockTracks;
    }, testMockTracks);
  });

  test('complete end-to-end workflow: auth → add 4 players with songs → lineup → game', async ({
    page,
  }) => {
    // 1. Authentication
    await loginPage.goto();
    await loginPage.waitForLoad();
    expect(await loginPage.isOnLoginPage()).toBe(true);

    await loginPage.loginInMockMode();
    await expect(page).toHaveURL('/walkup_music/');
    expect(await playerPage.isOnPlayerManagementPage()).toBe(true);

    // 2. Add first player (for now without song to get basic workflow working)
    const player1 = testPlayers[0]; // Mike Trout
    await playerPage.createPlayer(player1.name);
    expect(await playerPage.playerExists(player1.name)).toBe(true);

    // 3. Add second player
    const player2 = testPlayers[1]; // Aaron Judge
    await playerPage.createPlayer(player2.name);
    expect(await playerPage.playerExists(player2.name)).toBe(true);

    // 4. Add third player
    const player3 = testPlayers[2]; // Mookie Betts
    await playerPage.createPlayer(player3.name);
    expect(await playerPage.playerExists(player3.name)).toBe(true);

    // 5. Add fourth player
    const player4 = testPlayers[3]; // Ronald Acuña Jr.
    await playerPage.createPlayer(player4.name);
    expect(await playerPage.playerExists(player4.name)).toBe(true);

    // 13. Verify all players exist and create lineup
    const allPlayers = await playerPage.getPlayerNames();
    expect(allPlayers).toContain(player1.name);
    expect(allPlayers).toContain(player2.name);
    expect(allPlayers).toContain(player3.name);
    expect(allPlayers).toContain(player4.name);

    // Navigate to lineup management and create batting order
    expect(await lineupPage.isOnLineupManagementPage()).toBe(true);

    const battingOrder = [
      player1.name,
      player2.name,
      player3.name,
      player4.name,
    ];
    for (const playerName of battingOrder) {
      await lineupPage.addPlayerToLineup(playerName);
    }

    // Verify lineup order
    const lineupOrder = await lineupPage.getLineupPlayers();
    expect(lineupOrder).toEqual(battingOrder);

    // Start the game
    expect(await lineupPage.isStartGameEnabled()).toBe(true);
    await lineupPage.startGame();

    // Verify game mode and initial state
    expect(await gamePage.isInGameMode()).toBe(true);
    expect(await gamePage.getCurrentBatterName()).toBe(battingOrder[0]);
    expect(await gamePage.getOnDeckBatterName()).toBe(battingOrder[1]);
    expect(await gamePage.getInTheHoleBatterName()).toBe(battingOrder[2]);

    // Test playback controls in game mode
    if (
      (await gamePage.arePlaybackControlsVisible()) &&
      (await gamePage.isPlayButtonVisible())
    ) {
      await gamePage.clickPlay();
      await page.waitForTimeout(1000); // Let song play briefly

      if (await gamePage.isPauseButtonVisible()) {
        await gamePage.clickPause();
      }
    }

    // Advance through all batters to test full rotation
    await gamePage.clickNextBatter();
    expect(await gamePage.getCurrentBatterName()).toBe(battingOrder[1]);
    expect(await gamePage.getOnDeckBatterName()).toBe(battingOrder[2]);
    expect(await gamePage.getInTheHoleBatterName()).toBe(battingOrder[3]);

    await gamePage.clickNextBatter();
    expect(await gamePage.getCurrentBatterName()).toBe(battingOrder[2]);
    expect(await gamePage.getOnDeckBatterName()).toBe(battingOrder[3]);
    expect(await gamePage.getInTheHoleBatterName()).toBe(battingOrder[0]); // Wrapped around

    await gamePage.clickNextBatter();
    expect(await gamePage.getCurrentBatterName()).toBe(battingOrder[3]);
    expect(await gamePage.getOnDeckBatterName()).toBe(battingOrder[0]); // Wrapped around
    expect(await gamePage.getInTheHoleBatterName()).toBe(battingOrder[1]); // Wrapped around

    // Test persistence - refresh page and verify state is maintained
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still be in game mode with same batter
    expect(await gamePage.isInGameMode()).toBe(true);
    expect(await gamePage.getCurrentBatterName()).toBe(battingOrder[3]);

    // End the game
    await gamePage.clickEndGame();
    expect(await gamePage.isInGameMode()).toBe(false);
    expect(await lineupPage.isOnLineupManagementPage()).toBe(true);

    // Final verification - all data should be intact
    const finalPlayers = await playerPage.getPlayerNames();
    expect(finalPlayers).toContain(player1.name);
    expect(finalPlayers).toContain(player2.name);
    expect(finalPlayers).toContain(player3.name);
    expect(finalPlayers).toContain(player4.name);

    const finalLineup = await lineupPage.getLineupPlayers();
    expect(finalLineup).toEqual(battingOrder);
  });
});
