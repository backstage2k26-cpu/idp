import {
  createUnifiedTheme,
  genPageTheme,
  pageTheme,
  palettes,
  shapes,
} from '@backstage/theme';
import { GSPANN_COLORS } from './gspannBrand';

const gspannPageHeaderTheme = genPageTheme({
  colors: [
    GSPANN_COLORS.headerLavender,
    GSPANN_COLORS.headerMid,
    GSPANN_COLORS.headerPeach,
  ],
  shape: shapes.wave,
  options: {
    fontColor: GSPANN_COLORS.textPrimary,
  },
});

const gspannPageTheme = Object.fromEntries(
  Object.keys(pageTheme).map(themeId => [themeId, gspannPageHeaderTheme]),
) as typeof pageTheme;

const gspannLightPalette = {
  ...palettes.light,
  primary: {
    ...palettes.light.primary,
    main: GSPANN_COLORS.navy,
    dark: GSPANN_COLORS.navyDark,
    light: GSPANN_COLORS.navyMid,
    contrastText: GSPANN_COLORS.textOnDark,
  },
  secondary: {
    ...palettes.light.secondary,
    main: GSPANN_COLORS.burgundy,
    dark: GSPANN_COLORS.burgundy,
    light: GSPANN_COLORS.burgundyLight,
    contrastText: GSPANN_COLORS.textOnDark,
  },
  background: {
    ...palettes.light.background,
    default: GSPANN_COLORS.background,
    paper: GSPANN_COLORS.surface,
  },
  navigation: {
    background: GSPANN_COLORS.navyDark,
    indicator: GSPANN_COLORS.burgundy,
    color: GSPANN_COLORS.textMuted,
    selectedColor: GSPANN_COLORS.textOnDark,
    navItem: {
      hoverBackground: 'rgba(255, 255, 255, 0.08)',
    },
    submenu: {
      background: GSPANN_COLORS.navy,
    },
  },
  tabbar: {
    indicator: GSPANN_COLORS.burgundy,
  },
  pinSidebarButton: {
    icon: GSPANN_COLORS.textOnDark,
    background: GSPANN_COLORS.navyDark,
  },
  link: GSPANN_COLORS.navyMid,
  linkHover: GSPANN_COLORS.burgundy,
};

const gspannDarkPalette = {
  ...palettes.dark,
  primary: {
    ...palettes.dark.primary,
    main: GSPANN_COLORS.navyLight,
    dark: GSPANN_COLORS.navy,
    light: GSPANN_COLORS.navyMid,
    contrastText: GSPANN_COLORS.textOnDark,
  },
  secondary: {
    ...palettes.dark.secondary,
    main: GSPANN_COLORS.burgundyLight,
    dark: GSPANN_COLORS.burgundy,
    contrastText: GSPANN_COLORS.textOnDark,
  },
  navigation: {
    background: '#0F1926',
    indicator: GSPANN_COLORS.burgundy,
    color: GSPANN_COLORS.textMuted,
    selectedColor: GSPANN_COLORS.textOnDark,
    navItem: {
      hoverBackground: 'rgba(255, 255, 255, 0.06)',
    },
    submenu: {
      background: GSPANN_COLORS.navyDark,
    },
  },
  tabbar: {
    indicator: GSPANN_COLORS.burgundyLight,
  },
  pinSidebarButton: {
    icon: GSPANN_COLORS.textOnDark,
    background: '#0F1926',
  },
};

export const platformLightTheme = createUnifiedTheme({
  palette: gspannLightPalette,
  pageTheme: gspannPageTheme,
});

export const platformDarkTheme = createUnifiedTheme({
  palette: gspannDarkPalette,
  pageTheme: gspannPageTheme,
});

export { GSPANN_COLORS, PLATFORM_COLORS } from './gspannBrand';
