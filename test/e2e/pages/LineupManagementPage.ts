import type { Page, Locator } from '@playwright/test';
import { BasePage } from '@/../test/e2e/pages/BasePage';

/**
 * Page object for lineup management functionality
 */
export class LineupManagementPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Selectors
  private readonly lineupColumn = '[data-testid="lineup-column"]';
  private readonly availablePlayersColumn =
    '[data-testid="available-players-column"]';
  private readonly lineupPlayer = '[data-testid="lineup-player"]';
  private readonly availablePlayer = '[data-testid="available-player"]';
  private readonly startGameButton = '[data-testid="start-game-button"]';
  private readonly addPlayerButton = '[data-testid="add-player-button"]';
  // Button selectors for future use
  // private readonly addToLineupButton = '.add-button';
  // private readonly removeFromLineupButton = '.remove-button';
  // private readonly moveUpButton = '.move-button:has-text("↑")';
  // private readonly moveDownButton = '.move-button:has-text("↓")';

  /**
   * Check if we're on the lineup management page
   */
  async isOnLineupManagementPage(): Promise<boolean> {
    return (
      (await this.isVisible(this.lineupColumn)) &&
      (await this.isVisible(this.availablePlayersColumn))
    );
  }

  /**
   * Get players in the lineup
   */
  async getLineupPlayers(): Promise<string[]> {
    await this.waitForSelector(this.lineupColumn);
    const players = await this.page
      .locator(`${this.lineupColumn} ${this.lineupPlayer}`)
      .all();
    const names: string[] = [];

    for (const player of players) {
      const nameElement = player.locator('[data-testid="player-name"]');
      const name = await nameElement.textContent();
      if (name) names.push(name);
    }

    return names;
  }

  /**
   * Get available players (not in lineup)
   */
  async getAvailablePlayers(): Promise<string[]> {
    await this.waitForSelector(this.availablePlayersColumn);
    const players = await this.page
      .locator(`${this.availablePlayersColumn} ${this.availablePlayer}`)
      .all();
    const names: string[] = [];

    for (const player of players) {
      const nameElement = player.locator('[data-testid="player-name"]');
      const name = await nameElement.textContent();
      if (name) names.push(name);
    }

    return names;
  }

  /**
   * Add a player from available to lineup using the + button
   */
  async addPlayerToLineup(playerName: string) {
    const availablePlayers = await this.page
      .locator(`${this.availablePlayersColumn} ${this.availablePlayer}`)
      .all();

    let sourcePlayer: Locator | null = null;
    for (const player of availablePlayers) {
      const nameElement = player.locator('[data-testid="player-name"]');
      const name = await nameElement.textContent();
      if (name === playerName) {
        sourcePlayer = player;
        break;
      }
    }

    if (!sourcePlayer) {
      throw new Error(`Available player "${playerName}" not found`);
    }

    // Find and click the + button for this player
    const addButton = sourcePlayer.locator('.btn-outline-success');
    await addButton.click();
    await this.page.waitForTimeout(500); // Wait for action to complete
  }

  /**
   * Remove a player from lineup to available using the - button
   */
  async removePlayerFromLineup(playerName: string) {
    const lineupPlayers = await this.page
      .locator(`${this.lineupColumn} ${this.lineupPlayer}`)
      .all();

    let sourcePlayer: Locator | null = null;
    for (const player of lineupPlayers) {
      const nameElement = player.locator('[data-testid="player-name"]');
      const name = await nameElement.textContent();
      if (name === playerName) {
        sourcePlayer = player;
        break;
      }
    }

    if (!sourcePlayer) {
      throw new Error(`Lineup player "${playerName}" not found`);
    }

    // Find and click the - button for this player
    const removeButton = sourcePlayer.locator('.btn-outline-danger');
    await removeButton.click();
    await this.page.waitForTimeout(500); // Wait for action to complete
  }

  /**
   * Move a player up in the lineup using the ↑ button
   */
  async movePlayerUp(playerName: string) {
    const lineupPlayers = await this.page
      .locator(`${this.lineupColumn} ${this.lineupPlayer}`)
      .all();

    let sourcePlayer: Locator | null = null;
    for (const player of lineupPlayers) {
      const nameElement = player.locator('[data-testid="player-name"]');
      const name = await nameElement.textContent();
      if (name === playerName) {
        sourcePlayer = player;
        break;
      }
    }

    if (!sourcePlayer) {
      throw new Error(`Lineup player "${playerName}" not found`);
    }

    // Find and click the ↑ button for this player
    const upButton = sourcePlayer.locator('.btn-outline-secondary').first(); // First move button is up
    await upButton.click();
    await this.page.waitForTimeout(500); // Wait for action to complete
  }

  /**
   * Move a player down in the lineup using the ↓ button
   */
  async movePlayerDown(playerName: string) {
    const lineupPlayers = await this.page
      .locator(`${this.lineupColumn} ${this.lineupPlayer}`)
      .all();

    let sourcePlayer: Locator | null = null;
    for (const player of lineupPlayers) {
      const nameElement = player.locator('[data-testid="player-name"]');
      const name = await nameElement.textContent();
      if (name === playerName) {
        sourcePlayer = player;
        break;
      }
    }

    if (!sourcePlayer) {
      throw new Error(`Lineup player "${playerName}" not found`);
    }

    // Find and click the ↓ button for this player
    const downButton = sourcePlayer.locator('.btn-outline-secondary').last(); // Last move button is down
    await downButton.click();
    await this.page.waitForTimeout(500); // Wait for action to complete
  }

  /**
   * Click the start game button
   */
  async startGame() {
    await this.clickWithRetry(this.startGameButton);
  }

  /**
   * Check if start game button is enabled
   */
  async isStartGameEnabled(): Promise<boolean> {
    const button = this.page.locator(this.startGameButton);
    return !(await button.isDisabled());
  }

  /**
   * Click add player button
   */
  async clickAddPlayer() {
    await this.clickWithRetry(this.addPlayerButton);
  }

  /**
   * Get the lineup size
   */
  async getLineupSize(): Promise<number> {
    const players = await this.getLineupPlayers();
    return players.length;
  }

  /**
   * Get the available players count
   */
  async getAvailablePlayersCount(): Promise<number> {
    const players = await this.getAvailablePlayers();
    return players.length;
  }

  /**
   * Check if a player is in the lineup
   */
  async isPlayerInLineup(playerName: string): Promise<boolean> {
    const lineupPlayers = await this.getLineupPlayers();
    return lineupPlayers.includes(playerName);
  }

  /**
   * Check if a player is available (not in lineup)
   */
  async isPlayerAvailable(playerName: string): Promise<boolean> {
    const availablePlayers = await this.getAvailablePlayers();
    return availablePlayers.includes(playerName);
  }
}
