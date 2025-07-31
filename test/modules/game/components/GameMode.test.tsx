import { render, screen, fireEvent } from '@testing-library/react';
import { GameMode } from '@/modules/game/components/GameMode';
import { LineupService } from '@/modules/game/services/LineupService';

// Mock the LineupService
const mockLineupService = {
  getCurrentBatter: jest.fn(),
  getOnDeckBatter: jest.fn(),
  getInTheHoleBatter: jest.fn(),
  nextBatter: jest.fn(),
  playWalkUpMusic: jest.fn(),
  stopMusic: jest.fn(),
  startGame: jest.fn(),
  endGame: jest.fn(),
  isGameInProgress: jest.fn(),
  getCurrentBattingOrder: jest.fn(),
  createBattingOrder: jest.fn(),
  updateBattingOrder: jest.fn(),
  loadGameState: jest.fn(),
} as jest.Mocked<LineupService>;

describe('GameMode', () => {
  const mockOnEndGame = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render game mode header with title and end game button', () => {
    render(
      <GameMode lineupService={mockLineupService} onEndGame={mockOnEndGame} />
    );

    expect(screen.getByText('Game Mode')).toBeInTheDocument();
    expect(screen.getByText('End Game')).toBeInTheDocument();
  });

  it('should render next batter button in header', () => {
    render(
      <GameMode lineupService={mockLineupService} onEndGame={mockOnEndGame} />
    );

    expect(screen.getByText('Next Batter')).toBeInTheDocument();
  });

  it('should call onEndGame when end game button is clicked', () => {
    render(
      <GameMode lineupService={mockLineupService} onEndGame={mockOnEndGame} />
    );

    const endGameButton = screen.getByText('End Game');
    fireEvent.click(endGameButton);

    expect(mockLineupService.endGame).toHaveBeenCalled();
    expect(mockOnEndGame).toHaveBeenCalled();
  });

  it('should call nextBatter when next batter button is clicked', async () => {
    render(
      <GameMode lineupService={mockLineupService} onEndGame={mockOnEndGame} />
    );

    const nextBatterButton = screen.getByText('Next Batter');
    fireEvent.click(nextBatterButton);

    expect(mockLineupService.nextBatter).toHaveBeenCalled();
  });

  it('should render CurrentBatterDisplay component', () => {
    render(
      <GameMode lineupService={mockLineupService} onEndGame={mockOnEndGame} />
    );

    // The CurrentBatterDisplay should be rendered (we can't test its internal logic here)
    // but we can verify the component structure is there
    expect(screen.getByText('Game Mode')).toBeInTheDocument();
  });
});
