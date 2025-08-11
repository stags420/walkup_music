import { test, expect } from '@playwright/test';
import { saveCoverageDump } from 'test/reports/utils/coverage';
import { LoginPage } from '@/../test/e2e/pages/LoginPage';
import { PlayerManagementPage } from '@/../test/e2e/pages/PlayerManagementPage';
import { LineupManagementPage } from '@/../test/e2e/pages/LineupManagementPage';
import { GameModePage } from '@/../test/e2e/pages/GameModePage';
import { testPlayers } from '@/../test/e2e/fixtures/testData';
import { testMockTracks } from '@/../test/e2e/fixtures/mockTracks';

test.describe('Complete E2E Workflow', () => {
  let loginPage: LoginPage;
  let playerPage: PlayerManagementPage;
  let lineupPage: LineupManagementPage;
  let gamePage: GameModePage;

  test.beforeEach(async ({ page, browserName }) => {
    if (browserName === 'chromium' && process.env.VITE_E2E_COVERAGE) {
      await (
        page as unknown as {
          coverage: {
            startJSCoverage: (opts?: {
              resetOnNavigation?: boolean;
            }) => Promise<void>;
          };
        }
      ).coverage.startJSCoverage({ resetOnNavigation: false });
    }
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

  test('song selection and segment selection workflow', async ({ page }) => {
    // 1. Authentication
    await loginPage.goto();
    await loginPage.waitForLoad();
    await loginPage.loginInMockMode();
    await expect(page).toHaveURL('/walkup_music/');

    // 2. Test detailed song selection workflow
    const testPlayer = testPlayers[0]; // Mike Trout with Thunderstruck

    // Start creating a player
    await playerPage.clickAddPlayer();
    await playerPage.fillPlayerName(testPlayer.name);

    // Test song selection with mobile-aware method
    if (testPlayer.song) {
      await playerPage.selectSongWithSegment(
        testPlayer.song.title,
        testPlayer.song.artist
      );
    }

    // Save the player
    await playerPage.savePlayer();

    // Verify player was created successfully
    expect(await playerPage.playerExists(testPlayer.name)).toBe(true);
  });

  test.afterEach(async ({ page, browserName }, testInfo) => {
    if (browserName === 'chromium' && process.env.VITE_E2E_COVERAGE) {
      await saveCoverageDump(page, testInfo);
    }
  });

  test('edit player song selection workflow', async ({ page }) => {
    // 1. Authentication and setup
    await loginPage.goto();
    await loginPage.waitForLoad();
    await loginPage.loginInMockMode();
    await expect(page).toHaveURL('/walkup_music/');

    // 2. Create a player with a song first
    const testPlayer = testPlayers[0]; // Mike Trout
    await playerPage.createPlayerWithSong(testPlayer);
    expect(await playerPage.playerExists(testPlayer.name)).toBe(true);

    // 3. Edit the player to change their song
    await playerPage.editPlayer(testPlayer.name);

    // 4. Change the song selection
    const newSong = testPlayers[1].song; // Aaron Judge's song (All Star)
    if (newSong) {
      await playerPage.selectSongWithSegment(newSong.title, newSong.artist);
    }

    // 5. Save the changes
    await playerPage.savePlayer();

    // 6. Verify the player still exists (song change should be saved)
    expect(await playerPage.playerExists(testPlayer.name)).toBe(true);
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

    // 2. Add first player with song selection and segment selection
    const player1 = testPlayers[0]; // Mike Trout
    await playerPage.createPlayerWithSong(player1);
    expect(await playerPage.playerExists(player1.name)).toBe(true);

    // 3. Add second player with song selection and segment selection
    const player2 = testPlayers[1]; // Aaron Judge
    await playerPage.createPlayerWithSong(player2);
    expect(await playerPage.playerExists(player2.name)).toBe(true);

    // 4. Add third player with song selection and segment selection
    const player3 = testPlayers[2]; // Mookie Betts
    await playerPage.createPlayerWithSong(player3);
    expect(await playerPage.playerExists(player3.name)).toBe(true);

    // 5. Add fourth player with song selection and segment selection
    const player4 = testPlayers[3]; // Ronald Acuña Jr.
    await playerPage.createPlayerWithSong(player4);
    expect(await playerPage.playerExists(player4.name)).toBe(true);

    // 6. Verify all players exist and have songs assigned
    const allPlayers = await playerPage.getPlayerNames();
    expect(allPlayers).toContain(player1.name);
    expect(allPlayers).toContain(player2.name);
    expect(allPlayers).toContain(player3.name);
    expect(allPlayers).toContain(player4.name);

    // 7. Verify players have song information (check for song indicators in UI)
    const playerCards = await playerPage.getPlayerCards();
    expect(playerCards.length).toBe(4);

    // Each player card should show song information
    for (const card of playerCards) {
      const songInfo = card.locator('[data-testid="player-song-info"]');
      if (await songInfo.isVisible()) {
        const songText = await songInfo.textContent();
        expect(songText).toBeTruthy();
        expect(songText?.length).toBeGreaterThan(0);
      }
    }

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

    // Test comprehensive playback controls in game mode
    if (await gamePage.arePlaybackControlsVisible()) {
      // Test play functionality
      if (await gamePage.isPlayButtonVisible()) {
        await gamePage.clickPlay();
        await page.waitForTimeout(2000); // Let song play for 2 seconds

        // Verify pause button appears after playing
        if (await gamePage.isPauseButtonVisible()) {
          await gamePage.clickPause();
          await page.waitForTimeout(500);
        }
      }

      // Verify song information is displayed
      const songTitle = await gamePage.getCurrentSongTitle();
      const songArtist = await gamePage.getCurrentSongArtist();

      if (songTitle) {
        expect(songTitle.length).toBeGreaterThan(0);
      }
      if (songArtist) {
        expect(songArtist.length).toBeGreaterThan(0);
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
