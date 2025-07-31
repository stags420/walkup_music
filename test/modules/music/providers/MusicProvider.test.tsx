import { render, screen } from '@testing-library/react';
import { MusicProvider } from '@/modules/music/providers/MusicProvider';
import { useMusic } from '@/modules/music/hooks/useMusic';

// Test component that uses the music context
function TestComponent() {
  const { musicService } = useMusic();
  return <div data-testid="music-service">{musicService.constructor.name}</div>;
}

describe('MusicProvider', () => {
  it('should provide music service to children', () => {
    render(
      <MusicProvider>
        <TestComponent />
      </MusicProvider>
    );

    expect(screen.getByTestId('music-service')).toHaveTextContent(
      'MockMusicService'
    );
  });

  it('should provide the same service instance across renders', () => {
    function ServiceInstanceComponent() {
      const { musicService } = useMusic();
      return (
        <div data-testid="service-instance">
          {musicService.constructor.name}
        </div>
      );
    }

    const { rerender } = render(
      <MusicProvider>
        <ServiceInstanceComponent />
      </MusicProvider>
    );

    const firstRender = screen.getByTestId('service-instance').textContent;

    rerender(
      <MusicProvider>
        <ServiceInstanceComponent />
      </MusicProvider>
    );

    const secondRender = screen.getByTestId('service-instance').textContent;
    expect(firstRender).toBe(secondRender);
  });

  it('should accept injected service for testing', () => {
    const mockService = { searchTracks: jest.fn() };

    function TestComponent() {
      const { musicService } = useMusic();
      return (
        <div data-testid="injected-service">
          {typeof musicService.searchTracks}
        </div>
      );
    }

    render(
      <MusicProvider musicService={mockService}>
        <TestComponent />
      </MusicProvider>
    );

    expect(screen.getByTestId('injected-service')).toHaveTextContent(
      'function'
    );
  });

  it('should render children properly', () => {
    render(
      <MusicProvider>
        <div data-testid="child">Child component</div>
      </MusicProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toHaveTextContent('Child component');
  });
});
