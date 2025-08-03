import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { TestPlayer } from '../fixtures/testData';

/**
 * Page object for player management functionality
 */
export class PlayerManagementPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Selectors
  private readonly addPlayerButton = '[data-testid="add-player-button"]';
  private readonly playerNameInput = '[data-testid="player-name-input"]';
  private readonly savePlayerButton = '[data-testid="save-player-button"]';
  private readonly cancelPlayerButton = '[data-testid="cancel-player-button"]';
  private readonly playerList = '[data-testid="player-list"]';
  private readonly playerCard = '[data-testid="player-card"]';
  private readonly editPlayerButton = '[data-testid="edit-player-button"]';
  private readonly deletePlayerButton = '[data-testid="delete-player-button"]';
  private readonly confirmDeleteButton =
    '[data-testid="confirm-delete-button"]';
  private readonly selectSongButton = '[data-testid="select-song-button"]';
  private readonly songSearchInput = '[data-testid="song-search-input"]';
  private readonly songResult = '[data-testid="song-result"]';
  private readonly selectSongResultButton =
    '[data-testid="select-song-result-button"]';
  private readonly segmentSelector = '[data-testid="segment-selector"]';
  private readonly confirmSongButton = '[data-testid="confirm-song-button"]';
  private readonly playerForm = '[data-testid="player-form"]';
  private readonly playButton = '[data-testid="play-button"]';
  private readonly pauseButton = '[data-testid="pause-button"]';

  /**
   * Check if we're on the player management page
   */
  async isOnPlayerManagementPage(): Promise<boolean> {
    return await this.isVisible(this.addPlayerButton);
  }

  /**
   * Click the add player button
   */
  async clickAddPlayer() {
    await this.clickWithRetry(this.addPlayerButton);
    // Wait for the modal to appear instead of the container div
    await this.waitForSelector(this.playerNameInput);
  }

  /**
   * Fill in player name
   */
  async fillPlayerName(name: string) {
    await this.fillWithRetry(this.playerNameInput, name);
  }

  /**
   * Save the player
   */
  async savePlayer() {
    await this.clickWithRetry(this.savePlayerButton);
    await this.page.waitForTimeout(500); // Wait for save to complete
  }

  /**
   * Cancel player creation/editing
   */
  async cancelPlayer() {
    await this.clickWithRetry(this.cancelPlayerButton);
  }

  /**
   * Create a new player with just a name
   */
  async createPlayer(name: string) {
    await this.clickAddPlayer();
    await this.fillPlayerName(name);
    await this.savePlayer();
  }

  /**
   * Create a player with a song
   */
  async createPlayerWithSong(player: TestPlayer) {
    await this.clickAddPlayer();
    await this.fillPlayerName(player.name);

    if (player.song) {
      await this.selectSongWithSegment(player.song.title, player.song.artist);
    }

    await this.savePlayer();
  }

  /**
   * Select a song for the current player
   */
  async selectSong(title: string, artist: string) {
    await this.clickWithRetry(this.selectSongButton);
    await this.waitForSelector(this.songSearchInput);

    // Search for the song (no search button, it's automatic)
    await this.fillWithRetry(this.songSearchInput, `${title} ${artist}`);

    // Wait for results to load (search is automatic with debounce)
    await this.page.waitForTimeout(1000);
    await this.waitForSelector(this.songResult);

    // Select the first result
    await this.clickWithRetry(this.songResult);
    await this.clickWithRetry(this.selectSongResultButton);

    // Wait for segment selector and confirm
    await this.waitForSelector(this.segmentSelector);
    await this.clickWithRetry(this.confirmSongButton);
  }

  /**
   * Select a song with segment selection for the current player
   */
  async selectSongWithSegment(title: string, _artist: string) {
    // Click the select song button to open the song selector modal
    await this.clickWithRetry(this.selectSongButton);
    await this.waitForSelector(this.songSearchInput);

    // Search for the song title
    await this.fillWithRetry(this.songSearchInput, title);
    await this.page.waitForTimeout(3000); // Wait for debounce + network + processing

    // Wait for at least one result
    await this.waitForSelector(this.songResult);

    // Select the first matching result
    await this.clickWithRetry(this.songResult);

    // Wait for the button to become enabled before clicking
    await this.page.waitForFunction(
      () => {
        const button = document.querySelector(
          '[data-testid="select-song-result-button"]'
        ) as HTMLButtonElement;
        return button && !button.disabled;
      },
      { timeout: 5000 }
    );

    await this.clickWithRetry(this.selectSongResultButton);

    // Wait for segment selector to appear
    await this.waitForSelector(this.segmentSelector);

    // Verify segment selector is visible
    const segmentSelector = this.page.locator(this.segmentSelector);
    await segmentSelector.waitFor({ state: 'visible' });

    // Confirm the selected segment (skip playback testing for now)
    await this.clickWithRetry(this.confirmSongButton);
  }

  /**
   * Get all player cards
   */
  async getPlayerCards(): Promise<Locator[]> {
    await this.waitForSelector(this.playerList);
    return await this.page.locator(this.playerCard).all();
  }

  /**
   * Get player names from the list
   */
  async getPlayerNames(): Promise<string[]> {
    const cards = await this.getPlayerCards();
    const names: string[] = [];

    for (const card of cards) {
      const nameElement = card.locator('[data-testid="player-name"]');
      const name = await nameElement.textContent();
      if (name) names.push(name);
    }

    return names;
  }

  /**
   * Edit a player by name
   */
  async editPlayer(playerName: string) {
    const cards = await this.getPlayerCards();

    for (const card of cards) {
      const nameElement = card.locator('[data-testid="player-name"]');
      const name = await nameElement.textContent();

      if (name === playerName) {
        await card.locator(this.editPlayerButton).click();
        await this.waitForSelector(this.playerForm);
        return;
      }
    }

    throw new Error(`Player "${playerName}" not found`);
  }

  /**
   * Delete a player by name
   */
  async deletePlayer(playerName: string) {
    const cards = await this.getPlayerCards();

    for (const card of cards) {
      const nameElement = card.locator('[data-testid="player-name"]');
      const name = await nameElement.textContent();

      if (name === playerName) {
        await card.locator(this.deletePlayerButton).click();
        await this.waitForSelector(this.confirmDeleteButton);
        await this.clickWithRetry(this.confirmDeleteButton);
        await this.page.waitForTimeout(500); // Wait for deletion to complete
        return;
      }
    }

    throw new Error(`Player "${playerName}" not found`);
  }

  /**
   * Check if a player exists in the list
   */
  async playerExists(playerName: string): Promise<boolean> {
    const names = await this.getPlayerNames();
    return names.includes(playerName);
  }

  /**
   * Get the number of players
   */
  async getPlayerCount(): Promise<number> {
    const cards = await this.getPlayerCards();
    return cards.length;
  }

  /**
   * Enter player name (alias for fillPlayerName)
   */
  async enterPlayerName(name: string) {
    await this.fillPlayerName(name);
  }

  /**
   * Search for a song
   */
  async searchForSong(query: string) {
    await this.clickWithRetry(this.selectSongButton);
    await this.waitForSelector(this.songSearchInput);
    await this.fillWithRetry(this.songSearchInput, query);
    await this.page.waitForTimeout(1000); // Wait for search results
  }

  /**
   * Select the first song from search results
   */
  async selectFirstSong() {
    await this.waitForSelector(this.songResult);
    await this.clickWithRetry(this.songResult);
    await this.clickWithRetry(this.selectSongResultButton);
  }

  /**
   * Select a song segment
   */
  async selectSongSegment() {
    await this.waitForSelector(this.segmentSelector);
    // The segment selector might have default selection, just wait for it to be ready
    await this.page.waitForTimeout(500);
  }

  /**
   * Confirm the selected song segment
   */
  async confirmSongSegment() {
    await this.clickWithRetry(this.confirmSongButton);
  }

  /**
   * Check if play button is visible
   */
  async isPlayButtonVisible(): Promise<boolean> {
    return await this.isVisible(this.playButton);
  }

  /**
   * Check if pause button is visible
   */
  async isPauseButtonVisible(): Promise<boolean> {
    return await this.isVisible(this.pauseButton);
  }

  /**
   * Click the play button
   */
  async clickPlayButton() {
    await this.clickWithRetry(this.playButton);
  }

  /**
   * Click the pause button
   */
  async clickPauseButton() {
    await this.clickWithRetry(this.pauseButton);
  }
}
