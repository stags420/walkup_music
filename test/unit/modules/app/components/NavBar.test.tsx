import { render, screen } from '@testing-library/react';
import { NavBar } from '@/modules/app/components/NavBar';
import { useAuthActions } from '@/modules/auth/hooks/useAuthActions';
import { useAuthUser } from '@/modules/auth/hooks/useAuthUser';
import { useSettingsActions } from '@/modules/app/hooks/useSettingsActions';
import { useSettingsTheme } from '@/modules/app/hooks/useSettingsTheme';

jest.mock('@/modules/auth/hooks/useAuthUser', () => ({
  useAuthUser: jest.fn(),
}));

jest.mock('@/modules/auth/hooks/useAuthActions', () => ({
  useAuthActions: jest.fn(),
}));

jest.mock('@/modules/app/hooks/useSettingsTheme', () => ({
  useSettingsTheme: jest.fn(),
}));

jest.mock('@/modules/app/hooks/useSettingsActions', () => ({
  useSettingsActions: jest.fn(),
}));

const mockUseAuthUser = useAuthUser as jest.MockedFunction<typeof useAuthUser>;
const mockUseAuthActions = useAuthActions as jest.MockedFunction<
  typeof useAuthActions
>;
const mockUseSettingsTheme = useSettingsTheme as jest.MockedFunction<
  typeof useSettingsTheme
>;
const mockUseSettingsActions = useSettingsActions as jest.MockedFunction<
  typeof useSettingsActions
>;

mockUseAuthUser.mockReturnValue(undefined);
mockUseAuthActions.mockReturnValue({
  logout: jest.fn().mockResolvedValue(undefined),
});
mockUseSettingsTheme.mockReturnValue('dark');
mockUseSettingsActions.mockReturnValue({
  setTheme: jest.fn(),
});

describe('NavBar', () => {
  test('renders the ROBO-KITTY tagline', () => {
    render(<NavBar />);

    expect(
      screen.getByText('This website was built using ROBO-KITTY')
    ).toBeInTheDocument();
  });
});
