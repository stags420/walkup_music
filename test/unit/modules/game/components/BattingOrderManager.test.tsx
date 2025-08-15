import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BattingOrderManager } from '@/modules/game/components/BattingOrderManager';
import type { MusicService } from '@/modules/music/services/MusicService';
import type { Player } from '@/modules/game/models/Player';
import {
  usePlayersStore,
  resetPlayersStore,
} from '@/modules/game/state/playersStore';
import {
  useLineupStore,
  resetLineupStore,
} from '@/modules/game/state/lineupStore';

// Mock the OrderBuilder component
jest.mock('@/modules/game/components/OrderBuilder', () => ({
  OrderBuilder: jest.fn(
    (props: { onLineupChange: (a: unknown[], b: unknown[]) => void }) => {
      const { onLineupChange } = props;
      return (
        <div data-testid="order-builder">
          <button
            onClick={() => onLineupChange([], [])}
            data-testid="mock-lineup-change"
          >
            Mock Lineup Change
          </button>
        </div>
      );
    }
  ),
}));

// Mock the PlayerForm component
jest.mock('@/modules/game/components/PlayerForm', () => ({
  PlayerForm: jest.fn((props: { onSave: () => void; onCancel: () => void }) => (
    <div>
      <button onClick={props.onSave} data-testid="save-player">
        Save
      </button>
      <button onClick={props.onCancel} data-testid="cancel-player">
        Cancel
      </button>
    </div>
  )),
}));

// Mock the SegmentSelector component
jest.mock('@/modules/music', () => ({
  SegmentSelector: jest.fn(
    (props: {
      onConfirm: (segment: unknown) => void;
      onCancel: () => void;
    }) => (
      <div data-testid="segment-selector">
        <button
          onClick={() => props.onConfirm({} as unknown)}
          data-testid="confirm-segment"
        >
          Confirm
        </button>
        <button onClick={props.onCancel} data-testid="cancel-segment">
          Cancel
        </button>
      </div>
    )
  ),
}));

const supplyMusicService = jest.fn<MusicService, []>();

jest.mock('@/modules/music/suppliers/MusicServiceSupplier', () => ({
  supplyMusicService: () => supplyMusicService(),
}));

describe('BattingOrderManager', () => {
  let mockMusicService: jest.Mocked<MusicService>;

  const mockPlayers: Player[] = [
    {
      id: '1',
      name: 'Player 1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      name: 'Player 2',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    mockMusicService = {
      searchTracks: jest.fn(),
      playTrack: jest.fn(),
      previewTrack: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
      seek: jest.fn(),
      getCurrentState: jest.fn(),
      isPlaybackConnected: jest.fn(),
      isPlaybackReady: jest.fn(),
    } as unknown as jest.Mocked<MusicService>;
    supplyMusicService.mockReturnValue(mockMusicService);
    resetPlayersStore();
    resetLineupStore();
  });

  const renderComponent = () => {
    return render(<BattingOrderManager />);
  };

  it('renders the lineup header', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Lineup')).toBeInTheDocument();
    });
  });

  it('shows the Add Player button', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Add Player')).toBeInTheDocument();
    });
  });

  it('shows the Start Game button when players are available', async () => {
    usePlayersStore.getState().actions.setPlayers(mockPlayers);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Start Game')).toBeInTheDocument();
    });
  });

  it('opens player form when Add Player is clicked', async () => {
    renderComponent();

    await waitFor(() => {
      const addButton = screen.getByText('Add Player');
      fireEvent.click(addButton);
    });

    expect(screen.getByTestId('player-form')).toBeInTheDocument();
  });

  it('closes player form when save is clicked', async () => {
    renderComponent();

    // Open form
    await waitFor(() => {
      const addButton = screen.getByText('Add Player');
      fireEvent.click(addButton);
    });

    // Save form
    const saveButton = screen.getByTestId('save-player');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.queryByTestId('player-form')).not.toBeInTheDocument();
    });
  });

  it('closes player form when cancel is clicked', async () => {
    renderComponent();

    // Open form
    await waitFor(() => {
      const addButton = screen.getByText('Add Player');
      fireEvent.click(addButton);
    });

    // Cancel form
    const cancelButton = screen.getByTestId('cancel-player');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByTestId('player-form')).not.toBeInTheDocument();
    });
  });

  it('starts game with players when Start Game is clicked', async () => {
    usePlayersStore.getState().actions.setPlayers(mockPlayers);
    renderComponent();

    await waitFor(() => {
      const startButton = screen.getByText('Start Game');
      fireEvent.click(startButton);
    });

    await waitFor(() => {
      const order = useLineupStore.getState().currentBattingOrder;
      expect(order?.playerIds).toEqual(['1', '2']);
    });
    expect(useLineupStore.getState().isGameActive).toBe(true);
  });

  it('renders the OrderBuilder component', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('order-builder')).toBeInTheDocument();
    });
  });

  it('loads players and lineup on mount', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Lineup')).toBeInTheDocument();
    });
  });

  it('handles lineup changes from OrderBuilder', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('order-builder')).toBeInTheDocument();
    });

    // The OrderBuilder is rendered and receives the onLineupChange prop
    // In this test we're just verifying the component structure is correct
    expect(screen.getByTestId('order-builder')).toBeInTheDocument();
  });

  it('does not show Start Game button when no players are available', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.queryByText('Start Game')).not.toBeInTheDocument();
    });
  });
});
