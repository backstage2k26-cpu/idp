import { ReactNode } from 'react';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { TimezoneClock } from './TimezoneClock';
import { GSPANN_COLORS, HOME_WIDGET_THEME } from '../../theme/gspannBrand';

const useStyles = makeStyles(theme => ({
  hero: {
    width: '100%',
    position: 'relative',
    backgroundColor: HOME_WIDGET_THEME.surface,
    borderRadius: theme.spacing(2),
    border: `1px solid ${HOME_WIDGET_THEME.border}`,
    boxShadow: HOME_WIDGET_THEME.heroShadow,
    overflow: 'hidden',
    padding: theme.spacing(3, 3, 3.5),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.spacing(2),
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 3,
      background: HOME_WIDGET_THEME.headerGradient,
    },
    [theme.breakpoints.up('sm')]: {
      padding: theme.spacing(3.5, 4, 4),
      gap: theme.spacing(2.5),
    },
  },
  topRow: {
    width: '100%',
    display: 'flex',
    justifyContent: 'flex-end',
    minHeight: 'auto',
    paddingBottom: theme.spacing(0.75),
    borderBottom: `1px solid ${HOME_WIDGET_THEME.borderSubtle}`,
    [theme.breakpoints.down('xs')]: {
      justifyContent: 'center',
    },
  },
  logo: {
    display: 'flex',
    justifyContent: 'center',
    lineHeight: 0,
  },
  searchWrap: {
    width: '100%',
    maxWidth: 680,
    '& .MuiFormControl-root': {
      margin: 0,
      width: '100%',
    },
    '& .MuiOutlinedInput-root': {
      backgroundColor: HOME_WIDGET_THEME.searchBg,
      borderRadius: theme.spacing(2.5),
      boxShadow: HOME_WIDGET_THEME.searchShadow,
      transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
      '& fieldset': {
        borderColor: HOME_WIDGET_THEME.searchBorder,
        borderWidth: 1.5,
      },
      '&:hover fieldset': {
        borderColor: HOME_WIDGET_THEME.searchBorderHover,
      },
      '&.Mui-focused': {
        boxShadow: `0 0 0 3px ${HOME_WIDGET_THEME.searchFocusRing}, ${HOME_WIDGET_THEME.searchShadow}`,
        '& fieldset': {
          borderColor: HOME_WIDGET_THEME.searchBorderFocus,
          borderWidth: 2,
        },
      },
    },
    '& .MuiOutlinedInput-input': {
      color: GSPANN_COLORS.textPrimary,
      fontSize: '1.0625rem',
      padding: theme.spacing(2, 2),
      '&::placeholder': {
        color: GSPANN_COLORS.textSecondary,
        opacity: 0.9,
      },
    },
    '& .MuiInputAdornment-root .MuiIconButton-root': {
      color: HOME_WIDGET_THEME.searchIcon,
    },
    '& .MuiInputAdornment-positionEnd .MuiButton-root': {
      color: HOME_WIDGET_THEME.link,
      fontWeight: 600,
    },
  },
}));

type HomeHeroBandProps = {
  logo: ReactNode;
  search: ReactNode;
};

export const HomeHeroBand = ({ logo, search }: HomeHeroBandProps) => {
  const classes = useStyles();

  return (
    <Box className={classes.hero}>
      <Box className={classes.topRow}>
        <TimezoneClock embedded />
      </Box>
      <Box className={classes.logo}>{logo}</Box>
      <Box className={classes.searchWrap}>{search}</Box>
    </Box>
  );
};
