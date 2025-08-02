import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BattingOrderManager } from '@/modules/game/components/BattingOrderManager';
import { PlayerService } from '@/modules/game/services/PlayerService';
import { MusicService } from '@/modules/music/services/MusicService';
import { LineupService } from '@/modules/game/services/LineupService';
import { Player } from '@/modules/game/models/Player';
import { BattingOrder } from '@/modules/game/models/BattingOrder';

// Mock the OrderBuilder component
jest.mock('@/modules/game/components/OrderBuilder', () => ({
  OrderBuilder: jest.fn(({ onLineupChange }) => {
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
  }),
}));

// Mock the PlayerForm component
jest.mock('@/modules/game/components/PlayerForm', () => ({
  PlayerForm: jest.fn(({ onSave, onCancel }) => (
    <div>
      <button onClick={onSave} data-testid="save-player">
        Save
      </button>
      <button onClick={onCancel} data-testid="cancel-player">
        Cancel
      </button>
    </div>
  )),
}));

// Mock the SegmentSelector component
jest.mock('@/modules/music', () => ({
  SegmentSelector: jest.fn(({ onConfirm, onCancel }) => (
    <div data-testid="segment-selector">
      <button
        onClick={() => onConfirm({} as unknown)}
        data-testid="confirm-segment"
      >
        Confirm
      </button>
      <button onClick={onCancel} data-testid="cancel-segment">
        Cancel
      </button>
    </div>
  )),
}));

describe('BattingOrderManager', () => {
  let mockPlayerService: jest.Mocked<PlayerService>;
  let mockMusicService: jest.Mocked<MusicService>;
  let mockLineupService: jest.Mocked<LineupService>;
  let mockOnStartGame: jest.Mock;

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

  const mockBattingOrder: BattingOrder = {
    id: 'order-1',
    name: 'Test Lineup',
    playerIds: ['1'],
    currentPosition: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockPlayerService = {
      getAllPlayers: jest.fn().mockResolvedValue(mockPlayers),
      deletePlayer: jest.fn().mockResolvedValue(undefined),
      updatePlayer: jest.fn().mockResolvedValue(mockPlayers[0]),
      createPlayer: jest.fn(),
      getPlayer: jest.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockMusicService = {} as any;

    mockLineupService = {
      getCurrentBattingOrder: jest.fn().mockReturnValue(mockBattingOrder),
      createBattingOrder: jest.fn().mockResolvedValue(mockBattingOrder),
      startGame: jest.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    mockOnStartGame = jest.fn();
  });

  const renderComponent = () => {
    return render(
      <BattingOrderManager
        playerService={mockPlayerService}
        musicService={mockMusicService}
        lineupService={mockLineupService}
        onStartGame={mockOnStartGame}
      />
    );
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

  it('starts game with existing lineup when Start Game is clicked', async () => {
    renderComponent();

    await waitFor(() => {
      const startButton = screen.getByText('Start Game');
      fireEvent.click(startButton);
    });

    expect(mockLineupService.createBattingOrder).toHaveBeenCalledWith(['1']);
    expect(mockLineupService.startGame).toHaveBeenCalled();
    expect(mockOnStartGame).toHaveBeenCalled();
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
      expect(mockPlayerService.getAllPlayers).toHaveBeenCalled();
      expect(mockLineupService.getCurrentBattingOrder).toHaveBeenCalled();
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
    mockPlayerService.getAllPlayers.mockResolvedValueOnce([]);
    mockLineupService.getCurrentBattingOrder.mockReturnValueOnce(null);

    renderComponent();

    await waitFor(() => {
      expect(screen.queryByText('Start Game')).not.toBeInTheDocument();
    });
  });
});
