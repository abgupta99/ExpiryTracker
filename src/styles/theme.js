// Central theme tokens for the app — colors, spacing, radii, typography and shadows
const colors = {
  primary: '#2b6cb0',
  primarySoft: '#dbeafe',
  primaryLight: '#bfdbfe',
  background: '#f6fbff',
  surface: '#ffffff',
  text: '#111827',
  muted: '#6b7280',
  border: '#e6edf3',
  success: '#10b981',
  warn: '#f59e0b',
  danger: '#ef4444',
};

const spacing = {
  xxs: 4,
  xs: 8,
  s: 12,
  m: 16,
  l: 20,
  xl: 28,
};

const radii = {
  sm: 6,
  md: 10,
  lg: 12,
  round: 999,
};

const typography = {
  h1: 28,
  h2: 20,
  body: 16,
  small: 13,
};

const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
};

const theme = { colors, spacing, radii, typography, shadow };
export default theme;
