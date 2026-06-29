import { makeStyles } from '@material-ui/core/styles';
import { GSPANN_COLORS, PAGE_HEADER_MIN_HEIGHT } from './gspannBrand';

const useGlobalStyles = makeStyles({
  '@global': {
    '[data-testid="header"]': {
      minHeight: PAGE_HEADER_MIN_HEIGHT,
      display: 'flex',
      alignItems: 'center',
    },
    '[data-testid="header"] [data-testid="header-title"]': {
      fontSize: '1.5rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
      lineHeight: 1.2,
      color: GSPANN_COLORS.textPrimary,
    },
    '[data-testid="header"] [data-testid="header-subtitle"]': {
      color: GSPANN_COLORS.textSecondary,
    },
  },
});

/**
 * Aligns Backstage entity page headers with in-tab TabPageHeader dimensions.
 */
export const GspannGlobalStyles = () => {
  useGlobalStyles();
  return null;
};
