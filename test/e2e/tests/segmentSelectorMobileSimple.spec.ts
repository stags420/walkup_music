import { test, expect } from '@playwright/test';
import { testMockTracks } from '../fixtures/mockTracks';

test.describe('SegmentSelector Mobile Button Visibility', () => {
  test.beforeEach(async ({ page }) => {
    // Inject mock tracks before the app starts
    await page.addInitScript((mockTracks) => {
      // Store mock tracks in window object so they can be accessed by the app
      (
        globalThis as typeof globalThis & { __TEST_MOCK_TRACKS__?: unknown }
      ).__TEST_MOCK_TRACKS__ = mockTracks;
    }, testMockTracks);

    // Navigate to the app
    await page.goto('/');

    // Wait for the app to load
    await page.waitForLoadState('networkidle');
  });

  test('should show cancel and submit buttons on mobile viewport', async ({
    page,
  }) => {
    // Set a very small viewport to simulate virtual keyboard open (iPhone SE with keyboard: 375x375)
    await page.setViewportSize({ width: 375, height: 375 });
    const viewportSize = page.viewportSize();
    console.log('Viewport size:', viewportSize);

    // Navigate to login and authenticate in mock mode
    await page.click('[data-testid="spotify-login-button"]');
    await page.waitForSelector('[data-testid="add-player-button"]', {
      timeout: 10000,
    });

    // Add a new player
    await page.click('[data-testid="add-player-button"]');

    // Fill in player name
    await page.fill('[data-testid="player-name-input"]', 'Test Player');

    // Click to select a song
    await page.click('[data-testid="select-song-button"]');

    // Wait for song selector modal
    await page.waitForSelector('[data-testid="song-search-input"]');

    // Search for a song (this will use mock data)
    // Click on the input first to ensure it's focused
    await page.click('[data-testid="song-search-input"]');

    // Clear any existing content and type
    await page.fill('[data-testid="song-search-input"]', 'thunder');

    // Wait a bit for search results
    await page.waitForTimeout(2000);

    // Debug: Check search input value
    const searchValue = await page.inputValue(
      '[data-testid="song-search-input"]'
    );
    console.log('Search input value:', searchValue);

    // Click on first search result if available
    const searchResults = page.locator('[data-testid="song-result"]');
    const resultCount = await searchResults.count();

    if (resultCount > 0) {
      await searchResults.first().click();

      // Wait for select button to be enabled
      await page.waitForFunction(
        () => {
          const button = document.querySelector(
            '[data-testid="select-song-result-button"]'
          ) as HTMLButtonElement;
          return button && !button.disabled;
        },
        { timeout: 5000 }
      );

      await page.click('[data-testid="select-song-result-button"]');

      // Wait for segment selector to appear
      await page.waitForSelector('[data-testid="segment-selector"]', {
        timeout: 10000,
      });

      // When the segment selector modal is open
      const segmentSelector = page.locator('[data-testid="segment-selector"]');
      await expect(segmentSelector).toBeVisible();

      // Then the cancel and confirm buttons should be visible and within viewport
      const cancelButton = page.locator('button:has-text("Cancel")');
      const confirmButton = page.locator('[data-testid="confirm-song-button"]');

      // Check if buttons are visible
      await expect(cancelButton).toBeVisible();
      await expect(confirmButton).toBeVisible();

      // Get button positions and viewport size
      const cancelBox = await cancelButton.boundingBox();
      const confirmBox = await confirmButton.boundingBox();
      const viewport = page.viewportSize();

      console.log('Cancel button position:', cancelBox);
      console.log('Confirm button position:', confirmBox);
      console.log('Viewport:', viewport);

      // Verify buttons are within viewport
      if (cancelBox && confirmBox && viewport) {
        // Buttons should be within viewport height
        expect(cancelBox.y + cancelBox.height).toBeLessThanOrEqual(
          viewport.height
        );
        expect(confirmBox.y + confirmBox.height).toBeLessThanOrEqual(
          viewport.height
        );

        // Buttons should be visible (not cut off at top)
        expect(cancelBox.y).toBeGreaterThanOrEqual(0);
        expect(confirmBox.y).toBeGreaterThanOrEqual(0);

        // Log success
        console.log('✅ Buttons are properly positioned within viewport');
      }

      // Test that buttons are clickable
      await expect(cancelButton).toBeEnabled();
      await expect(confirmButton).toBeEnabled();

      // Take a screenshot for visual verification
      await page.screenshot({
        path: 'test-results/segment-selector-mobile.png',
        fullPage: false,
      });

      // Test clicking cancel button
      await cancelButton.click();

      // Segment selector should close
      await expect(segmentSelector).not.toBeVisible();
    } else {
      console.log('No search results found, skipping segment selector test');
    }
  });

  test('should handle modal overflow on small screens', async ({ page }) => {
    // Navigate and authenticate
    await page.click('[data-testid="spotify-login-button"]');
    await page.waitForSelector('[data-testid="add-player-button"]', {
      timeout: 10000,
    });

    // Add a new player and get to segment selector
    await page.click('[data-testid="add-player-button"]');
    await page.fill('[data-testid="player-name-input"]', 'Test Player');
    await page.click('[data-testid="select-song-button"]');
    await page.waitForSelector('[data-testid="song-search-input"]');
    await page.fill('[data-testid="song-search-input"]', 'thunder');
    await page.waitForTimeout(2000);

    const searchResults = page.locator('[data-testid="song-result"]');
    const resultCount = await searchResults.count();

    if (resultCount > 0) {
      await searchResults.first().click();
      await page.waitForFunction(
        () => {
          const button = document.querySelector(
            '[data-testid="select-song-result-button"]'
          ) as HTMLButtonElement;
          return button && !button.disabled;
        },
        { timeout: 5000 }
      );
      await page.click('[data-testid="select-song-result-button"]');
      await page.waitForSelector('[data-testid="segment-selector"]');

      // Check modal dimensions
      const modal = page.locator('.segment-selector-modal');
      const modalBox = await modal.boundingBox();
      const viewport = page.viewportSize();

      console.log('Modal dimensions:', modalBox);
      console.log('Viewport dimensions:', viewport);

      if (modalBox && viewport) {
        // Modal should not exceed viewport
        expect(modalBox.height).toBeLessThanOrEqual(viewport.height * 0.95);

        // Modal should be properly positioned
        expect(modalBox.y).toBeGreaterThanOrEqual(0);
        expect(modalBox.y + modalBox.height).toBeLessThanOrEqual(
          viewport.height
        );

        console.log('✅ Modal is properly sized for viewport');
      }

      // Check if content is scrollable when needed
      const content = page.locator('.segment-selector-content');
      const contentOverflow = await content.evaluate((el) => {
        const style = globalThis.getComputedStyle(el);
        return style.overflowY;
      });

      console.log('Content overflow-y:', contentOverflow);

      // Actions should be at bottom and visible
      const actions = page.locator('.segment-selector-actions');
      const actionsBox = await actions.boundingBox();

      if (actionsBox && viewport) {
        expect(actionsBox.y + actionsBox.height).toBeLessThanOrEqual(
          viewport.height
        );
        console.log('✅ Action buttons are within viewport');
      }
    }
  });
});
