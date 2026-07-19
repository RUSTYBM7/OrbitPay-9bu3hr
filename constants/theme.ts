// OrbitPay Finance — Design System Tokens
export const Colors = {
  // Brand
  primary: '#1B6B4A',
  primaryLight: '#2A8A62',
  primaryDark: '#0F4530',
  mint: '#3DAA7B',
  mintLight: '#6DC9A0',
  mintPale: '#A8E4C8',

  // Surfaces (Glass / Mint-glass)
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

  // Crypto accent
  bitcoin: '#F7931A',
  ethereum: '#627EEA',
  ripple: '#00AAE4',

  // Premium gradient stops
  premiumFrom: '#1B6B4A',
  premiumTo: '#27AE60',
};

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
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
};
