/**
 * GSPANN brand palette — extracted from gspann-logo.svg and gspann.com
 * @see https://www.gspann.com/
 */
export const GSPANN_COLORS = {
  /** Logo wordmark navy */
  navy: '#1C355E',
  navyDark: '#152840',
  navyMid: '#2A4A73',
  navyLight: '#3D5F8A',
  /** gspann.com website header */
  headerLavender: '#E2E4F6',
  headerPeach: '#F7E9E4',
  headerMid: '#EDE8F0',
  headerLink: '#4A69BD',
  /** Logo mark burgundy */
  burgundy: '#9C182F',
  burgundyLight: '#B82038',
  burgundyMuted: 'rgba(156, 24, 47, 0.12)',
  textOnDark: '#FFFFFF',
  textMuted: '#8FA3BC',
  textPrimary: '#1C355E',
  textSecondary: '#5A6B7D',
  border: '#E2E8F0',
  background: '#F8F9FB',
  surface: '#FFFFFF',
};

/** gspann.com horizontal header gradient — used on entity and tab headers */
export const PAGE_HEADER_GRADIENT = `linear-gradient(90deg, ${GSPANN_COLORS.headerLavender} 0%, ${GSPANN_COLORS.headerMid} 50%, ${GSPANN_COLORS.headerPeach} 100%)`;

export const PAGE_HEADER_SHADOW = '0 2px 8px rgba(28, 53, 94, 0.08)';

/**
 * Home page design tokens — aligned with gspann.com colour system.
 * @see https://www.gspann.com/
 *
 * Page canvas: headerLavender (#E2E4F6)
 * Surfaces:    white (#FFFFFF) — same as gspann.com content cards
 * Text:        navy primary, muted secondary
 * Links/CTA:   headerLink periwinkle (#4A69BD)
 * Accent:      burgundy (#9C182F) — logo mark, used sparingly
 * Headers:     lavender → mid → peach gradient band
 */
export const HOME_WIDGET_THEME = {
  pageBg: GSPANN_COLORS.headerLavender,
  surface: GSPANN_COLORS.surface,
  headerGradient: PAGE_HEADER_GRADIENT,
  accent: GSPANN_COLORS.burgundy,
  link: GSPANN_COLORS.headerLink,
  border: GSPANN_COLORS.border,
  borderSubtle: 'rgba(28, 53, 94, 0.08)',
  heroShadow: PAGE_HEADER_SHADOW,
  shadow: '0 2px 12px rgba(28, 53, 94, 0.07)',
  listHover: GSPANN_COLORS.burgundyMuted,
  linkHover: 'rgba(74, 105, 189, 0.08)',
  iconBg: GSPANN_COLORS.headerLavender,
  iconBorder: GSPANN_COLORS.headerMid,
  iconHoverShadow: '0 4px 12px rgba(74, 105, 189, 0.12)',
  searchBg: GSPANN_COLORS.surface,
  searchBorder: GSPANN_COLORS.border,
  searchBorderHover: GSPANN_COLORS.headerLink,
  searchBorderFocus: GSPANN_COLORS.headerLink,
  searchShadow: '0 2px 12px rgba(74, 105, 189, 0.1)',
  searchFocusRing: 'rgba(74, 105, 189, 0.18)',
  searchIcon: GSPANN_COLORS.navyMid,
  zoneColors: {
    ist: '#2E7D5A',
    pst: '#C4841D',
    est: '#D4644A',
    utc: GSPANN_COLORS.headerLink,
    europe: '#5B4BA8',
  },
} as const;

/** Fixed height for all in-tab page headers (matches Backstage entity header) */
export const PAGE_HEADER_MIN_HEIGHT = 136;

export type PageHeaderAccent =
  | 'brand'
  | 'gcp'
  | 'argo'
  | 'sonarqube'
  | 'github-actions';

export const PAGE_HEADER_ACCENTS: Record<PageHeaderAccent, string> = {
  brand: GSPANN_COLORS.burgundy,
  gcp: '#4285F4',
  argo: '#EF7B4D',
  sonarqube: '#4B9FD5',
  'github-actions': '#24292F',
};

/** @deprecated Use GSPANN_COLORS */
export const PLATFORM_COLORS = {
  navyDeep: GSPANN_COLORS.navyDark,
  navy: GSPANN_COLORS.navy,
  navyMid: GSPANN_COLORS.navyMid,
  blue: GSPANN_COLORS.navyMid,
  blueBright: GSPANN_COLORS.navyLight,
  blueSoft: GSPANN_COLORS.navyLight,
  blueLight: '#E8EEF5',
  textOnDark: GSPANN_COLORS.textOnDark,
  textMuted: GSPANN_COLORS.textMuted,
  border: GSPANN_COLORS.border,
  background: GSPANN_COLORS.background,
  burgundy: GSPANN_COLORS.burgundy,
};
