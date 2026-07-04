import { ReactNode } from 'react';
import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { GSPANN_COLORS, HOME_WIDGET_THEME } from '../../theme/gspannBrand';

const useStyles = makeStyles(theme => ({
  panel: {
    width: '100%',
    height: '100%',
    minHeight: 280,
    backgroundColor: HOME_WIDGET_THEME.surface,
    borderRadius: theme.spacing(2),
    border: `1px solid ${HOME_WIDGET_THEME.border}`,
    boxShadow: HOME_WIDGET_THEME.shadow,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: theme.spacing(2, 2.5),
    borderBottom: `1px solid ${HOME_WIDGET_THEME.border}`,
    borderLeft: `4px solid ${HOME_WIDGET_THEME.accent}`,
    background: HOME_WIDGET_THEME.headerGradient,
  },
  title: {
    color: GSPANN_COLORS.navy,
    fontWeight: 600,
    fontSize: '0.9375rem',
    letterSpacing: '-0.01em',
    lineHeight: 1.3,
  },
  body: {
    flex: 1,
    padding: theme.spacing(2, 2.5, 2.5),
    minWidth: 0,
  },
}));

type HomeWidgetPanelProps = {
  title: string;
  children: ReactNode;
  className?: string;
};

export const HomeWidgetPanel = ({
  title,
  children,
  className,
}: HomeWidgetPanelProps) => {
  const classes = useStyles();

  return (
    <Box className={`${classes.panel}${className ? ` ${className}` : ''}`}>
      <Box className={classes.header}>
        <Typography className={classes.title} component="h2">
          {title}
        </Typography>
      </Box>
      <Box className={classes.body}>{children}</Box>
    </Box>
  );
};
