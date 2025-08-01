import { render, screen } from '@testing-library/react';
import { MusicProvider } from '@/modules/music/providers/MusicProvider';

describe('MusicProvider', () => {
  it('should render children properly', () => {
    render(
      <MusicProvider>
        <div data-testid="child">Child component</div>
      </MusicProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toHaveTextContent('Child component');
  });

  it('should accept injected service for testing', () => {
    const mockService = {
      searchTracks: jest.fn(),
      playTrack: jest.fn(),
      previewTrack: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
      seek: jest.fn(),
      getCurrentTrack: jest.fn(),
      isPlaybackReady: jest.fn(),
      getCurrentState: jest.fn(),
      isPlaybackConnected: jest.fn(),
    };

    render(
      <MusicProvider musicService={mockService}>
        <div data-testid="child">Child component</div>
      </MusicProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('should work without injected service', () => {
    render(
      <MusicProvider>
        <div data-testid="child">Child component</div>
      </MusicProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});
