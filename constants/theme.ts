// OrbitPay Finance — Design System Tokens

// ─── Light Theme ─────────────────────────────────────────────────────
export const LightColors = {
  // Brand
  primary: '#1B6B4A',
  primaryLight: '#2A8A62',
  primaryDark: '#0F4530',
  mint: '#3DAA7B',
  mintLight: '#6DC9A0',
  mintPale: '#A8E4C8',

  // Surfaces
  background: '#EAF5EF',
  backgroundDeep: '#D6EDDF',
  surface: '#FFFFFF',
  surfaceMint: 'rgba(255,255,255,0.82)',
  surfaceGlass: 'rgba(255,255,255,0.65)',
  card: '#FFFFFF',
  cardMint: '#F0FAF5',

  // Text
  textPrimary: '#0E3D26',
  textSecondary: '#3A7A58',
  textMuted: '#7AAB8E',
  textOnDark: '#FFFFFF',
  textOnMint: '#0E3D26',

  // Semantic
  success: '#27AE60',
  successBg: '#E8F8EE',
  warning: '#F39C12',
  warningBg: '#FEF6E4',
  error: '#E74C3C',
  errorBg: '#FDECEA',
  info: '#2980B9',

  // UI
  border: 'rgba(45,122,90,0.15)',
  divider: 'rgba(45,122,90,0.10)',
  shadow: 'rgba(15,69,48,0.12)',
  overlay: 'rgba(14,61,38,0.40)',

  // Tab bar
  tabActive: '#1B6B4A',
  tabInactive: '#7AAB8E',
  tabBar: '#FFFFFF',
  tabBarBorder: 'rgba(45,122,90,0.12)',

  // Crypto
  bitcoin: '#F7931A',
  ethereum: '#627EEA',
  ripple: '#00AAE4',

  // Premium gradient stops
  premiumFrom: '#1B6B4A',
  premiumTo: '#27AE60',
};

// ─── Dark Theme ───────────────────────────────────────────────────────
export const DarkColors = {
  // Brand — keep brand identity
  primary: '#3DAA7B',
  primaryLight: '#52BF90',
  primaryDark: '#2A8A62',
  mint: '#3DAA7B',
  mintLight: '#6DC9A0',
  mintPale: '#1B4D35',

  // Surfaces
  background: '#0D1F17',
  backgroundDeep: '#071410',
  surface: '#132A1E',
  surfaceMint: 'rgba(19,42,30,0.92)',
  surfaceGlass: 'rgba(19,42,30,0.75)',
  card: '#132A1E',
  cardMint: '#1A3828',

  // Text
  textPrimary: '#E8F5EF',
  textSecondary: '#8ECFAC',
  textMuted: '#4E8A6A',
  textOnDark: '#FFFFFF',
  textOnMint: '#E8F5EF',

  // Semantic — keep consistent
  success: '#2ECC71',
  successBg: '#0D2E1B',
  warning: '#F39C12',
  warningBg: '#2A1E08',
  error: '#E74C3C',
  errorBg: '#2D0E0A',
  info: '#3498DB',

  // UI
  border: 'rgba(61,170,123,0.20)',
  divider: 'rgba(61,170,123,0.12)',
  shadow: 'rgba(0,0,0,0.40)',
  overlay: 'rgba(0,0,0,0.65)',

  // Tab bar
  tabActive: '#3DAA7B',
  tabInactive: '#4E8A6A',
  tabBar: '#0F2419',
  tabBarBorder: 'rgba(61,170,123,0.15)',

  // Crypto
  bitcoin: '#F7931A',
  ethereum: '#627EEA',
  ripple: '#00AAE4',

  // Premium gradient stops
  premiumFrom: '#1B6B4A',
  premiumTo: '#27AE60',
};

// Default export (used by all components via useTheme hook)
// Components import Colors from theme via the ThemeContext
export let Colors = LightColors;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 40,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 50,
  circle: 999,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
};
