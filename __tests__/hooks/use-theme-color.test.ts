import { renderHook } from '@testing-library/react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Colors } from '@/constants/theme';

jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: jest.fn(() => 'light'),
}));

import { useColorScheme } from '@/hooks/use-color-scheme';
const mockUseColorScheme = useColorScheme as jest.Mock;

describe('useThemeColor', () => {
  afterEach(() => {
    mockUseColorScheme.mockReturnValue('light');
  });

  it('returns the light color from Colors when no prop override is given', async () => {
    const { result } = await renderHook(() => useThemeColor({}, 'text'));
    expect(result.current).toBe(Colors.light.text);
  });

  it('returns the dark color from Colors when scheme is dark', async () => {
    mockUseColorScheme.mockReturnValue('dark');
    const { result } = await renderHook(() => useThemeColor({}, 'text'));
    expect(result.current).toBe(Colors.dark.text);
  });

  it('prefers the light prop override over the Colors value', async () => {
    const { result } = await renderHook(() =>
      useThemeColor({ light: '#AABBCC' }, 'text'),
    );
    expect(result.current).toBe('#AABBCC');
  });

  it('prefers the dark prop override when scheme is dark', async () => {
    mockUseColorScheme.mockReturnValue('dark');
    const { result } = await renderHook(() =>
      useThemeColor({ dark: '#112233' }, 'text'),
    );
    expect(result.current).toBe('#112233');
  });

  it('falls back to Colors.light when scheme is null', async () => {
    mockUseColorScheme.mockReturnValue(null);
    const { result } = await renderHook(() => useThemeColor({}, 'text'));
    expect(result.current).toBe(Colors.light.text);
  });
});
