import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page object for game mode functionality
 */
export class GameModePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Selectors
  private readonly currentBatterDisplay =
    '[data-testid="current-batter-display"]';
  private readonly currentBatterName = '[data-testid="current-batter-name"]';
  private readonly onDeckBatterName = '[data-testid="on-deck-batter-name"]';
  private readonly inTheHoleBatterName =
    '[data-testid="in-the-hole-batter-name"]';
  private readonly nextBatterButton = '[data-testid="next-batter-button"]';
  private readonly endGameButton = '[data-testid="end-game-button"]';
  private readonly playButton = '[data-testid="play-button"]';
  private readonly pauseButton = '[data-testid="pause-button"]';
  private readonly stopButton = '[data-testid="stop-button"]';
  private readonly currentSongTitle = '[data-testid="current-song-title"]';
  private readonly currentSongArtist = '[data-testid="current-song-artist"]';
  private readonly playbackControls = '[data-testid="playback-controls"]';

  /**
   * Check if we're in game mode
   */
  async isInGameMode(): Promise<boolean> {
    return await this.isVisible(this.currentBatterDisplay);
  }

  /**
   * Get the current batter name
   */
  async getCurrentBatterName(): Promise<string | null> {
    // Get the player name from within the current batter display
    const playerNameElement = this.page.locator(
      `${this.currentBatterName} [data-testid="player-name"]`
    );
    return await this.getTextContent(playerNameElement);
  }

  /**
   * Get the on-deck batter name
   */
  async getOnDeckBatterName(): Promise<string | null> {
    // Get the player name from within the on-deck batter display
    const playerNameElement = this.page.locator(
      `${this.onDeckBatterName} [data-testid="player-name"]`
    );
    return await this.getTextContent(playerNameElement);
  }

  /**
   * Get the in-the-hole batter name
   */
  async getInTheHoleBatterName(): Promise<string | null> {
    // Get the player name from within the in-the-hole batter display
    const playerNameElement = this.page.locator(
      `${this.inTheHoleBatterName} [data-testid="player-name"]`
    );
    return await this.getTextContent(playerNameElement);
  }

  /**
   * Click the next batter button
   */
  async clickNextBatter() {
    await this.clickWithRetry(this.nextBatterButton);
    await this.page.waitForTimeout(1000); // Wait for transition
  }

  /**
   * Click the end game button and confirm
   */
  async clickEndGame() {
    // Click the initial end game button
    await this.clickWithRetry(this.endGameButton);

    // Wait for confirmation modal to appear and click confirm
    await this.page.waitForSelector('.confirm-button', { state: 'visible' });
    await this.page.click('.confirm-button');

    // Wait for the game mode to end
    await this.page.waitForTimeout(1000);
  }

  /**
   * Click the play button
   */
  async clickPlay() {
    await this.clickWithRetry(this.playButton);
  }

  /**
   * Click the pause button
   */
  async clickPause() {
    await this.clickWithRetry(this.pauseButton);
  }

  /**
   * Click the stop button
   */
  async clickStop() {
    await this.clickWithRetry(this.stopButton);
  }

  /**
   * Get the current song title
   */
  async getCurrentSongTitle(): Promise<string | null> {
    if (await this.isVisible(this.currentSongTitle)) {
      return await this.getTextContent(this.currentSongTitle);
    }
    return null;
  }

  /**
   * Get the current song artist
   */
  async getCurrentSongArtist(): Promise<string | null> {
    if (await this.isVisible(this.currentSongArtist)) {
      return await this.getTextContent(this.currentSongArtist);
    }
    return null;
  }

  /**
   * Check if playback controls are visible
   */
  async arePlaybackControlsVisible(): Promise<boolean> {
    return await this.isVisible(this.playbackControls);
  }

  /**
   * Check if the play button is visible
   */
  async isPlayButtonVisible(): Promise<boolean> {
    return await this.isVisible(this.playButton);
  }

  /**
   * Check if the pause button is visible
   */
  async isPauseButtonVisible(): Promise<boolean> {
    return await this.isVisible(this.pauseButton);
  }

  /**
   * Check if the next batter button is enabled
   */
  async isNextBatterEnabled(): Promise<boolean> {
    const button = this.page.locator(this.nextBatterButton);
    return !(await button.isDisabled());
  }

  /**
   * Wait for batter transition to complete
   */
  async waitForBatterTransition() {
    await this.page.waitForTimeout(1000);
  }

  /**
   * Get all visible batter information
   */
  async getBatterInfo() {
    return {
      current: await this.getCurrentBatterName(),
      onDeck: await this.getOnDeckBatterName(),
      inTheHole: await this.getInTheHoleBatterName(),
    };
  }

  /**
   * Advance through multiple batters
   */
  async advanceBatters(count: number) {
    for (let i = 0; i < count; i++) {
      await this.clickNextBatter();
      await this.waitForBatterTransition();
    }
  }

  /**
   * Complete a full game cycle (advance through all batters once)
   */
  async completeGameCycle(expectedBatterCount: number) {
    const initialBatter = await this.getCurrentBatterName();

    // Advance through all batters
    for (let i = 0; i < expectedBatterCount; i++) {
      await this.clickNextBatter();
      await this.waitForBatterTransition();
    }

    // Should be back to the first batter
    const finalBatter = await this.getCurrentBatterName();
    return finalBatter === initialBatter;
  }
}
