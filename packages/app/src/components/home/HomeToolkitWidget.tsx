import { ReactNode } from 'react';
import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Link } from '@backstage/core-components';
import { GSPANN_COLORS, HOME_WIDGET_THEME } from '../../theme/gspannBrand';

type Tool = {
  label: string;
  url: string;
  icon: ReactNode;
};

const useStyles = makeStyles(theme => ({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: theme.spacing(1.5, 2),
    [theme.breakpoints.down('sm')]: {
      gridTemplateColumns: 'repeat(4, 1fr)',
    },
    [theme.breakpoints.down('xs')]: {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
  },
  tool: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textDecoration: 'none',
    color: 'inherit',
    padding: theme.spacing(1),
    borderRadius: theme.spacing(1.5),
    transition: 'background-color 0.15s ease, transform 0.15s ease',
    '&:hover': {
      backgroundColor: HOME_WIDGET_THEME.listHover,
      transform: 'translateY(-1px)',
    },
    '&:hover $iconWrap': {
      boxShadow: HOME_WIDGET_THEME.iconHoverShadow,
    },
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: HOME_WIDGET_THEME.iconBg,
    border: `1px solid ${HOME_WIDGET_THEME.iconBorder}`,
    marginBottom: theme.spacing(1),
    transition: 'box-shadow 0.15s ease',
  },
  label: {
    color: GSPANN_COLORS.textSecondary,
    fontSize: '0.8125rem',
    fontWeight: 500,
    textAlign: 'center',
    lineHeight: 1.25,
    maxWidth: 80,
  },
}));

type HomeToolkitWidgetProps = {
  tools: Tool[];
};

export const HomeToolkitWidget = ({ tools }: HomeToolkitWidgetProps) => {
  const classes = useStyles();

  return (
    <Box className={classes.grid}>
      {tools.map(tool => (
        <Link key={tool.url} to={tool.url} className={classes.tool}>
          <Box className={classes.iconWrap}>{tool.icon}</Box>
          <Typography className={classes.label} component="span">
            {tool.label}
          </Typography>
        </Link>
      ))}
    </Box>
  );
};
