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
    const mockService = { searchTracks: jest.fn() };

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
