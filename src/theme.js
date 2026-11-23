import { Dimensions, Platform } from 'react-native';

// C = colors
export const C = {
  night: '#0B1028', // app background, the deepest dusk
  dusk: '#151C40', // raised surfaces
  dusk2: '#1E2752', // inputs, secondary surfaces
  line: '#2C3670', // hairlines and outlines
  sand: '#EBD2A6', // primary accent: sandstone facade
  lantern: '#F5B65B', // selection, highlights: window glow
  lagoon: '#3FD8E6', // secondary accent: pool light
  mist: '#EEF1FB', // primary text
  haze: '#9BA4CA', // secondary text
  fog: '#626C9C', // tertiary text, disabled
  taken: '#2A3264', // occupied seats
  danger: '#FF7A8A',
  success: '#5BE3A8',
  white: '#FFFFFF',
  black: '#000000',
};

// F = fonts
export const F = {
  display: 'Syne_800ExtraBold',
  displayB: 'Syne_700Bold',
  displayM: 'Syne_600SemiBold',
  body: 'Manrope_500Medium',
  bodyR: 'Manrope_400Regular',
  semi: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  xbold: 'Manrope_800ExtraBold',
};

// R = rounded top
export const R = { xs: 8, s: 12, m: 18, l: 26, arch: 140, pill: 999 };

// S = spacing
export const S = { xs: 6, s: 10, m: 16, l: 22, xl: 30 };

export const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export const shadow = (color = '#000', y = 10, r = 24, o = 0.35) =>
  Platform.select({
    ios: { shadowColor: color, shadowOffset: { width: 0, height: y }, shadowRadius: r, shadowOpacity: o },
    android: { elevation: Math.round(y * 0.8) },
    default: {},
  });

export const glow = (color) =>
  Platform.select({
    ios: { shadowColor: color, shadowOffset: { width: 0, height: 0 }, shadowRadius: 12, shadowOpacity: 0.9 },
    android: { elevation: 6 },
    default: {},
  });

export const money = (n) =>
  '$' + Math.round(n).toLocaleString('en-US');
