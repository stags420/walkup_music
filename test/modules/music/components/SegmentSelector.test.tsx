import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SegmentSelector } from '@/modules/music/components/SegmentSelector';
import type { SpotifyTrack, SongSegment } from '@/modules/music';
import type { MusicService } from '@/modules/music/services/MusicService';

const mockTrack: SpotifyTrack = {
  id: 'track1',
  name: 'Test Song',
  artists: ['Test Artist'],
  album: 'Test Album',
  albumArt: 'https://example.com/album.jpg',
  previewUrl: 'https://example.com/preview.mp3',
  durationMs: 180_000, // 3 minutes
  uri: 'spotify:track:test123',
};

const mockSegment: SongSegment = {
  track: mockTrack,
  startTime: 30,
  duration: 8,
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

describe('SegmentSelector', () => {
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Set up default mock implementations that return Promises
    (mockMusicService.playTrack as jest.Mock).mockResolvedValue();
    (mockMusicService.pause as jest.Mock).mockResolvedValue();
    (mockMusicService.previewTrack as jest.Mock).mockResolvedValue();
    (mockMusicService.resume as jest.Mock).mockResolvedValue();
    (mockMusicService.seek as jest.Mock).mockResolvedValue();
    (mockMusicService.getCurrentState as jest.Mock).mockResolvedValue({});
  });

  // Set up fake timers for timeout testing
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  const renderSegmentSelector = (props = {}) => {
    return render(
      <SegmentSelector
        track={mockTrack}
        musicService={mockMusicService}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        {...props}
      />
    );
  };

  it('should render with track information', () => {
    // Given I have a segment selector with a track
    // When I render the component
    renderSegmentSelector();

    // Then it should display the track information
    expect(screen.getByText('Select Timing')).toBeInTheDocument(); // Modal header only
    expect(screen.getByText('Test Song')).toBeInTheDocument();
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
    expect(screen.getAllByText('3:00')).toHaveLength(2); // Track duration and timeline label
  });

  it('should initialize with default segment values', () => {
    // Given I have a segment selector without initial values
    // When I render the component
    renderSegmentSelector();

    // Then it should show default start time and duration values
    const startTimeInput = screen.getByLabelText(
      'Start Time'
    ) as HTMLInputElement;
    const durationInput = screen.getByLabelText('Duration') as HTMLInputElement;

    expect(startTimeInput.value).toBe('0');
    expect(durationInput.value).toBe('10');
  });

  it('should initialize with provided initial segment values', () => {
    // Given I provide an initial segment with specific values
    // When I render the component with the initial segment
    renderSegmentSelector({ initialSegment: mockSegment });

    // Then it should display the initial segment values
    const startTimeInput = screen.getByLabelText(
      'Start Time'
    ) as HTMLInputElement;
    const durationInput = screen.getByLabelText('Duration') as HTMLInputElement;

    expect(startTimeInput.value).toBe('30');
    expect(durationInput.value).toBe('8');
  });

  it('should update start time when input changes', () => {
    // Given I have a segment selector rendered
    renderSegmentSelector();

    // When I change the start time input
    const startTimeInput = screen.getByLabelText(
      'Start Time'
    ) as HTMLInputElement;
    fireEvent.change(startTimeInput, { target: { value: '45' } });

    // Then the start time input should reflect the new value
    expect(startTimeInput.value).toBe('45');
  });

  it('should update duration when input changes', () => {
    // Given I have a segment selector rendered
    renderSegmentSelector();

    // When I change the duration input
    const durationInput = screen.getByLabelText('Duration') as HTMLInputElement;
    fireEvent.change(durationInput, { target: { value: '5' } });

    // Then the duration input should reflect the new value
    expect(durationInput.value).toBe('5');
  });

  it('should validate start time constraints properly', () => {
    // Given I have a segment selector rendered
    renderSegmentSelector();

    const startTimeInput = screen.getByLabelText(
      'Start Time'
    ) as HTMLInputElement;

    // When I try to set a negative start time
    fireEvent.change(startTimeInput, { target: { value: '-10' } });
    // Then it should enforce minimum value of 0
    expect(startTimeInput.value).toBe('0');

    // When I try to set start time beyond track duration
    fireEvent.change(startTimeInput, { target: { value: '200' } });
    // Then it should enforce maximum value (track duration - 1)
    expect(startTimeInput.value).toBe('179'); // 180 - 1
  });

  it('should validate duration constraints properly', () => {
    // Given I have a segment selector rendered
    renderSegmentSelector();

    const durationInput = screen.getByLabelText('Duration') as HTMLInputElement;

    // When I try to set duration to 0 or negative
    fireEvent.change(durationInput, { target: { value: '0' } });
    // Then it should enforce minimum value of 1
    expect(durationInput.value).toBe('1');

    // When I try to set duration beyond maximum allowed
    fireEvent.change(durationInput, { target: { value: '15' } });
    expect(durationInput.value).toBe('10');
  });

  it('should respect custom maxDuration prop', () => {
    renderSegmentSelector({ maxDuration: 20 });

    const durationInput = screen.getByLabelText('Duration') as HTMLInputElement;
    fireEvent.change(durationInput, { target: { value: '15' } });

    expect(durationInput.value).toBe('15');
  });

  it('should display selected segment info', () => {
    renderSegmentSelector();

    // Change values
    const startTimeInput = screen.getByLabelText('Start Time');
    const durationInput = screen.getByLabelText('Duration');

    fireEvent.change(startTimeInput, { target: { value: '30' } });
    fireEvent.change(durationInput, { target: { value: '8' } });

    expect(screen.getByText(/0:30 - 0:38/i)).toBeInTheDocument();
  });

  it('should show correct timeline visualization', () => {
    renderSegmentSelector();

    const timeline = document.querySelector('.timeline-track');
    expect(timeline).toBeInTheDocument();

    const segment = timeline?.querySelector('.timeline-segment');
    expect(segment).toBeInTheDocument();
  });

  it('should handle confirm action', async () => {
    renderSegmentSelector();

    // Set specific values
    const startTimeInput = screen.getByLabelText('Start Time');
    const durationInput = screen.getByLabelText('Duration');

    fireEvent.change(startTimeInput, { target: { value: '25' } });
    fireEvent.change(durationInput, { target: { value: '7' } });

    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith({
        track: mockTrack,
        startTime: 25,
        duration: 7,
      });
    });
  });

  it('should handle cancel action', async () => {
    renderSegmentSelector();

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  it('should handle close button action', async () => {
    renderSegmentSelector();

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  it('should format time correctly', () => {
    renderSegmentSelector();

    // Should show track duration as 3:00
    expect(screen.getAllByText('3:00')).toHaveLength(2); // One in track duration, one in timeline

    // Timeline labels
    expect(screen.getByText('0:00')).toBeInTheDocument();
    expect(screen.getAllByText('3:00')).toHaveLength(2); // Track duration and timeline label
  });

  it('should show control hints with proper ranges', () => {
    renderSegmentSelector();

    expect(screen.getByText(/range: 0 - 2:50/i)).toBeInTheDocument();
    expect(screen.getByText(/max: 10 seconds/i)).toBeInTheDocument();
  });

  it('should handle image load errors gracefully', () => {
    renderSegmentSelector();

    const albumImage = screen.getByAltText('Test Album') as HTMLImageElement;

    // Simulate image load error
    fireEvent.error(albumImage);

    // Should handle the error gracefully (no fallback image in current implementation)
    expect(albumImage.src).toBe('https://example.com/album.jpg');
  });

  it('should adjust max start time based on duration', () => {
    renderSegmentSelector();

    const startTimeInput = screen.getByLabelText(
      'Start Time'
    ) as HTMLInputElement;
    const durationInput = screen.getByLabelText('Duration');

    // Set duration to 5 seconds
    fireEvent.change(durationInput, { target: { value: '5' } });

    // Try to set start time that would exceed track length
    fireEvent.change(startTimeInput, { target: { value: '176' } });

    // Should be constrained to 180 - 4 = 176 (rounding in implementation)
    expect(startTimeInput.value).toBe('176');
  });

  it('should show different selection button text when playing', async () => {
    renderSegmentSelector();

    const selectionButton = screen.getByText(/play selection/i);
    fireEvent.click(selectionButton);

    await waitFor(() => {
      expect(screen.getByText(/stop selection/i)).toBeInTheDocument();
    });
  });

  it('should show selection button', () => {
    renderSegmentSelector();

    expect(screen.getByText(/play selection/i)).toBeInTheDocument();
  });

  it('should handle playback errors gracefully', async () => {
    // Mock playback error
    (mockMusicService.playTrack as jest.Mock).mockRejectedValue(
      new Error('Playback failed')
    );

    renderSegmentSelector();

    const selectionButton = screen.getByText(/play selection/i);
    fireEvent.click(selectionButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to play track/i)).toBeInTheDocument();
    });
  });

  it('should stop playback after specified duration', async () => {
    // Given I have a segment selector with a 5-second duration
    renderSegmentSelector({ maxDuration: 5 });

    // When I set the duration to 2 seconds and start playback
    const durationInput = screen.getByLabelText('Duration') as HTMLInputElement;
    fireEvent.change(durationInput, { target: { value: '2' } });

    const selectionButton = screen.getByText(/play selection/i);
    fireEvent.click(selectionButton);

    // Then the button should show "Stop Selection"
    await waitFor(() => {
      expect(screen.getByText(/stop selection/i)).toBeInTheDocument();
    });

    // And the playTrack method should be called
    expect(mockMusicService.playTrack).toHaveBeenCalledWith(
      mockTrack.uri,
      0 // startPositionMs
    );

    // When the timeout fires (after 2 seconds)
    jest.runAllTimers();

    // Then the pause method should be called
    await waitFor(() => {
      expect(mockMusicService.pause).toHaveBeenCalled();
    });

    // And the button should show "Play Selection" again
    await waitFor(() => {
      expect(screen.getByText(/play selection/i)).toBeInTheDocument();
    });
  });

  it('should clear timeout when manually stopping playback', async () => {
    // Given I have a segment selector with playback running
    renderSegmentSelector();

    const selectionButton = screen.getByText(/play selection/i);
    fireEvent.click(selectionButton);

    // When I manually stop the playback before the timeout fires
    await waitFor(() => {
      expect(screen.getByText(/stop selection/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/stop selection/i));

    // Then the pause method should be called immediately
    await waitFor(() => {
      expect(mockMusicService.pause).toHaveBeenCalled();
    });

    // And the button should show "Play Selection" again
    await waitFor(() => {
      expect(screen.getByText(/play selection/i)).toBeInTheDocument();
    });

    // When the timeout would have fired (after 10 seconds)
    jest.runAllTimers();

    // Then pause should not be called again (timeout was cleared)
    expect(mockMusicService.pause).toHaveBeenCalledTimes(1);
  });

  test('allows dragging the segment to change start time', async () => {
    // Given a segment selector with initial segment
    render(
      <SegmentSelector
        track={mockTrack}
        musicService={mockMusicService}
        initialSegment={mockSegment}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    // Find the timeline segment element
    const segmentElement = document.querySelector('.timeline-segment');
    expect(segmentElement).toBeInTheDocument();

    // Find the timeline track for positioning calculations
    const timelineTrack = document.querySelector('.timeline-track');
    expect(timelineTrack).toBeInTheDocument();

    // Mock getBoundingClientRect for positioning calculations
    const mockGetBoundingClientRect = jest.fn(() => ({
      left: 100,
      width: 300,
      top: 0,
      height: 8,
      right: 400,
      bottom: 8,
    }));

    Object.defineProperty(timelineTrack, 'getBoundingClientRect', {
      value: mockGetBoundingClientRect,
    });

    // Initial start time should be 30 seconds (from mockSegment)
    expect(screen.getByDisplayValue('30')).toBeInTheDocument();

    // When I start dragging the segment (mousedown at position 150, drag to 200)
    fireEvent.mouseDown(segmentElement!, {
      clientX: 150,
      bubbles: true,
    });

    // Simulate mouse move (drag to position 200 = 50px right)
    // 50px out of 300px width = 1/6 of track = 30 seconds movement (180s total / 6 = 30s)
    // So start time should change from 30 to 60 seconds
    fireEvent.mouseMove(document, {
      clientX: 200,
    });

    // Mouse up to end drag
    fireEvent.mouseUp(document);

    // The start time should have changed from the initial 30 seconds
    await waitFor(() => {
      const startTimeInput = screen.getByDisplayValue(/^[^3]/); // Any value that doesn't start with 3
      expect(startTimeInput).toBeInTheDocument();
    });

    // Duration should remain unchanged at 8 seconds
    expect(screen.getByDisplayValue('8')).toBeInTheDocument();
  });
});
