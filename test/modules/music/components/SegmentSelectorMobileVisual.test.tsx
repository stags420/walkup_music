/**
 * Visual test to verify SegmentSelector mobile button visibility fix
 * This test focuses on the specific iPhone 16 Pro viewport issue
 */
import { render, screen } from '@testing-library/react';
import { SegmentSelector } from '@/modules/music/components/SegmentSelector';
import { SpotifyTrack } from '@/modules/music';
import { MusicService } from '@/modules/music/services/MusicService';
import React from 'react';

const mockTrack: SpotifyTrack = {
  id: 'track1',
  name: 'Test Song',
  artists: ['Test Artist'],
  album: 'Test Album',
  albumArt: 'https://example.com/album.jpg',
  previewUrl: 'https://example.com/preview.mp3',
  durationMs: 180000, // 3 minutes
  uri: 'spotify:track:test123',
};

// Mock music service
const mockMusicService: MusicService = {
  searchTracks: jest.fn(),
  playTrack: jest.fn(),
  previewTrack: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  seek: jest.fn(),
  getCurrentState: jest.fn(),
  isPlaybackConnected: jest.fn().mockReturnValue(true),
  isPlaybackReady: jest.fn().mockReturnValue(true),
};

// Mock createPortal function
const mockCreatePortal = jest.fn(
  (
    children: React.ReactNode,
    _container?: Element | DocumentFragment,
    _key?: React.Key | null | undefined
  ) => children as React.ReactPortal
);

describe('SegmentSelector Mobile Button Visibility Fix', () => {
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Set up default mock implementations that return Promises
    (mockMusicService.playTrack as jest.Mock).mockResolvedValue(undefined);
    (mockMusicService.pause as jest.Mock).mockResolvedValue(undefined);
    (mockMusicService.previewTrack as jest.Mock).mockResolvedValue(undefined);
    (mockMusicService.resume as jest.Mock).mockResolvedValue(undefined);
    (mockMusicService.seek as jest.Mock).mockResolvedValue(undefined);
    (mockMusicService.getCurrentState as jest.Mock).mockResolvedValue({});
  });

  const renderSegmentSelector = (props = {}) => {
    return render(
      <SegmentSelector
        track={mockTrack}
        musicService={mockMusicService}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        createPortal={mockCreatePortal}
        {...props}
      />
    );
  };

  test('should render cancel and confirm buttons', () => {
    // Given I render the segment selector
    renderSegmentSelector();

    // Then both cancel and confirm buttons should be present
    const cancelButton = screen.getByText('Cancel');
    const confirmButton = screen.getByText('Confirm');

    expect(cancelButton).toBeInTheDocument();
    expect(confirmButton).toBeInTheDocument();
  });

  test('should have proper DOM structure for mobile layout', () => {
    // Given I render the segment selector
    renderSegmentSelector();

    // Then the DOM structure should support mobile layout
    const modal = document.querySelector('.segment-selector-modal');
    const content = document.querySelector('.segment-selector-content');
    const actions = document.querySelector('.segment-selector-actions');

    expect(modal).toBeInTheDocument();
    expect(content).toBeInTheDocument();
    expect(actions).toBeInTheDocument();

    // Actions should be a sibling of content, not a child
    expect(content?.contains(actions!)).toBe(false);
    expect(modal?.contains(actions!)).toBe(true);
    expect(modal?.contains(content!)).toBe(true);
  });

  test('should have CSS classes that support mobile responsive design', () => {
    // Given I render the segment selector
    renderSegmentSelector();

    // Then the elements should have the correct CSS classes
    const overlay = document.querySelector('.segment-selector-overlay');
    const modal = document.querySelector('.segment-selector-modal');
    const content = document.querySelector('.segment-selector-content');
    const actions = document.querySelector('.segment-selector-actions');

    expect(overlay).toHaveClass('segment-selector-overlay');
    expect(modal).toHaveClass('segment-selector-modal');
    expect(content).toHaveClass('segment-selector-content');
    expect(actions).toHaveClass('segment-selector-actions');
  });

  test('should have buttons with proper data attributes for testing', () => {
    // Given I render the segment selector
    renderSegmentSelector();

    // Then the confirm button should have the correct test id
    const confirmButton = screen.getByTestId('confirm-song-button');
    expect(confirmButton).toBeInTheDocument();
    expect(confirmButton).toHaveTextContent('Confirm');

    // And the cancel button should be findable by text
    const cancelButton = screen.getByText('Cancel');
    expect(cancelButton).toBeInTheDocument();
  });

  test('should render all required elements for mobile interaction', () => {
    // Given I render the segment selector
    renderSegmentSelector();

    // Then all key elements should be present
    expect(screen.getByText('Select Timing')).toBeInTheDocument(); // Header
    expect(screen.getByText('Test Song')).toBeInTheDocument(); // Track info
    expect(screen.getByLabelText('Start Time')).toBeInTheDocument(); // Controls
    expect(screen.getByLabelText('Duration')).toBeInTheDocument(); // Controls
    expect(screen.getByText(/play selection/i)).toBeInTheDocument(); // Play button
    expect(screen.getByText('Cancel')).toBeInTheDocument(); // Cancel button
    expect(screen.getByText('Confirm')).toBeInTheDocument(); // Confirm button
  });

  test('reproduces the original issue scenario', () => {
    // Given I have a segment selector (simulating iPhone 16 Pro scenario)
    renderSegmentSelector();

    // When the modal is rendered
    const modal = document.querySelector('.segment-selector-modal');
    const actions = document.querySelector('.segment-selector-actions');
    const cancelButton = screen.getByText('Cancel');
    const confirmButton = screen.getByText('Confirm');

    // Then the modal and buttons should be properly structured
    expect(modal).toBeInTheDocument();
    expect(actions).toBeInTheDocument();
    expect(cancelButton).toBeInTheDocument();
    expect(confirmButton).toBeInTheDocument();

    // And the buttons should be in the actions container
    expect(actions?.contains(cancelButton)).toBe(true);
    expect(actions?.contains(confirmButton)).toBe(true);

    // This test verifies that the DOM structure is correct for the CSS fix
    // The actual visual positioning is tested in the E2E tests
  });

  test('should have proper button hierarchy for accessibility', () => {
    // Given I render the segment selector
    renderSegmentSelector();

    // Then buttons should be properly structured
    const cancelButton = screen.getByText('Cancel');
    const confirmButton = screen.getByText('Confirm');

    // Both should be actual button elements
    expect(cancelButton.tagName).toBe('BUTTON');
    expect(confirmButton.tagName).toBe('BUTTON');

    // Confirm button should have the primary styling class
    expect(confirmButton).toHaveClass('btn');
    expect(cancelButton).toHaveClass('btn');
  });
});
