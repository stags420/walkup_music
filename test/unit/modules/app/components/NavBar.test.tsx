import { render, screen } from '@testing-library/react';
import { NavBar } from '@/modules/app/components/NavBar';
import { useAuthActions } from '@/modules/auth/hooks/useAuthActions';
import { useAuthUser } from '@/modules/auth/hooks/useAuthUser';
import { useSettingsActions } from '@/modules/app/hooks/useSettingsActions';
import { useSettingsTheme } from '@/modules/app/hooks/useSettingsTheme';

jest.mock('@/modules/auth/hooks/useAuthActions', () => ({
  useAuthActions: jest.fn(),
}));

jest.mock('@/modules/auth/hooks/useAuthUser', () => ({
  useAuthUser: jest.fn(),
}));

jest.mock('@/modules/app/hooks/useSettingsActions', () => ({
  useSettingsActions: jest.fn(),
}));

jest.mock('@/modules/app/hooks/useSettingsTheme', () => ({
  useSettingsTheme: jest.fn(),
}));

const mockUseAuthActions = useAuthActions as jest.MockedFunction<
  typeof useAuthActions
>;
const mockUseAuthUser = useAuthUser as jest.MockedFunction<typeof useAuthUser>;
const mockUseSettingsActions = useSettingsActions as jest.MockedFunction<
  typeof useSettingsActions
>;
const mockUseSettingsTheme = useSettingsTheme as jest.MockedFunction<
  typeof useSettingsTheme
>;

describe('NavBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuthActions.mockReturnValue({
      logout: jest.fn(),
    } as unknown as ReturnType<typeof useAuthActions>);

    mockUseAuthUser.mockReturnValue(undefined);

    mockUseSettingsTheme.mockReturnValue('dark');
    mockUseSettingsActions.mockReturnValue({
      setTheme: jest.fn(),
    } as unknown as ReturnType<typeof useSettingsActions>);
  });

  test('should include the appended ROBO-KITTY tagline phrase', () => {
    render(<NavBar />);

    const tagline = screen.getByText(
      /This website was built using ROBO-KITTY/i
    );
    expect(tagline).toHaveTextContent('ALL HAIL THE ROBOTIC KITTEN');
  });
});
