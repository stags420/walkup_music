import type { Page, Locator } from '@playwright/test';

/**
 * Base page object with common functionality
 */
export class BasePage {
  constructor(protected page: Page) {}

  /**
   * Navigate to the application root
   */
  async goto() {
    await this.page.goto('/');
  }

  /**
   * Wait for the page to be fully loaded
   */
  async waitForLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get the page title
   */
  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Check if an element is visible
   */
  async isVisible(selector: string): Promise<boolean> {
    return await this.page.isVisible(selector);
  }

  /**
   * Wait for an element to be visible
   */
  async waitForSelector(selector: string, timeout = 10000): Promise<Locator> {
    await this.page.waitForSelector(selector, { timeout });
    return this.page.locator(selector);
  }

  /**
   * Click an element with retry logic
   */
  async clickWithRetry(selector: string, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await this.page.click(selector);
        return;
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await this.page.waitForTimeout(1000);
      }
    }
  }

  /**
   * Fill input with retry logic
   */
  async fillWithRetry(selector: string, value: string, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await this.page.fill(selector, value);
        return;
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await this.page.waitForTimeout(1000);
      }
    }
  }

  /**
   * Get text content of an element
   */
  async getTextContent(selector: string): Promise<string | null>;
  async getTextContent(locator: Locator): Promise<string | null>;
  async getTextContent(
    selectorOrLocator: string | Locator
  ): Promise<string | null> {
    return await (typeof selectorOrLocator === 'string'
      ? this.page.textContent(selectorOrLocator)
      : selectorOrLocator.textContent());
  }

  /**
   * Wait for a specific text to appear
   */
  async waitForText(text: string, timeout = 5000) {
    await this.page.waitForFunction(
      (searchText) => document.body.textContent?.includes(searchText),
      text,
      { timeout }
    );
  }

  /**
   * Take a screenshot for debugging
   */
  async screenshot(name: string) {
    await this.page.screenshot({ path: `e2e/screenshots/${name}.png` });
  }
}
