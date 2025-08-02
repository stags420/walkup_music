import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page object for the login page
 */
export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Selectors
  private readonly loginButton = '[data-testid="spotify-login-button"]';
  private readonly welcomeMessage = '.welcome-message';
  private readonly errorMessage = '.alert-danger';

  /**
   * Check if we're on the login page
   */
  async isOnLoginPage(): Promise<boolean> {
    return await this.isVisible(this.loginButton);
  }

  /**
   * Click the Spotify login button
   * In mock mode, this should immediately authenticate
   */
  async clickLogin() {
    await this.clickWithRetry(this.loginButton);
  }

  /**
   * Wait for successful authentication
   */
  async waitForAuthentication() {
    // In mock mode, we should be redirected immediately
    await this.page.waitForURL('/walkup_music/', { timeout: 10000 });
  }

  /**
   * Get error message if login fails
   */
  async getErrorMessage(): Promise<string | null> {
    if (await this.isVisible(this.errorMessage)) {
      return await this.getTextContent(this.errorMessage);
    }
    return null;
  }

  /**
   * Complete login flow in mock mode
   */
  async loginInMockMode() {
    await this.clickLogin();
    // In mock mode, authentication happens immediately without redirect
    // Wait for authenticated content to appear
    await this.page.waitForSelector('[data-testid="add-player-button"]', { timeout: 10000 });
  }
}