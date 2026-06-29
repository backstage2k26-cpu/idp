import React from 'react';
import { Box, Paper, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
  GSPANN_COLORS,
  PAGE_HEADER_ACCENTS,
  PAGE_HEADER_GRADIENT,
  PAGE_HEADER_MIN_HEIGHT,
  PAGE_HEADER_SHADOW,
  PageHeaderAccent,
} from '../../theme/gspannBrand';

const useStyles = makeStyles(theme => ({
  hero: {
    background: PAGE_HEADER_GRADIENT,
    borderRadius: theme.spacing(1.5),
    padding: theme.spacing(3),
    marginBottom: theme.spacing(3),
    color: GSPANN_COLORS.textPrimary,
    boxShadow: PAGE_HEADER_SHADOW,
    position: 'relative',
    overflow: 'hidden',
    minHeight: PAGE_HEADER_MIN_HEIGHT,
    display: 'flex',
    alignItems: 'center',
    borderLeft: '4px solid transparent',
    borderBottom: `1px solid ${GSPANN_COLORS.border}`,
    '&:before': {
      content: '""',
      position: 'absolute',
      top: -40,
      right: -40,
      width: 160,
      height: 160,
      borderRadius: '50%',
      background: 'rgba(156, 24, 47, 0.06)',
    },
  },
  heroContent: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: theme.spacing(2),
    width: '100%',
  },
  titleBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    flex: 1,
    minWidth: 0,
  },
  iconWrap: {
    backgroundColor: GSPANN_COLORS.surface,
    borderRadius: theme.spacing(1.5),
    padding: theme.spacing(1),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: 52,
    height: 52,
    boxShadow: '0 2px 8px rgba(28, 53, 94, 0.1)',
    border: `1px solid ${GSPANN_COLORS.border}`,
  },
  iconImage: {
    width: 36,
    height: 36,
    objectFit: 'contain',
  },
  title: {
    fontWeight: 700,
    letterSpacing: '-0.01em',
    fontSize: theme.typography.h3.fontSize,
    lineHeight: 1.2,
    marginBottom: 0,
    color: GSPANN_COLORS.textPrimary,
  },
  subtitle: {
    color: GSPANN_COLORS.textSecondary,
    marginTop: theme.spacing(0.5),
    fontSize: '0.875rem',
  },
  metaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginTop: theme.spacing(1),
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    flexWrap: 'wrap',
    flexShrink: 0,
  },
}));

export type TabPageHeaderProps = {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconSrc?: string;
  iconAlt?: string;
  accent?: PageHeaderAccent;
  chips?: React.ReactNode;
  actions?: React.ReactNode;
  trailing?: React.ReactNode;
};

export const TabPageHeader = ({
  title,
  subtitle,
  icon,
  iconSrc,
  iconAlt = '',
  accent = 'brand',
  chips,
  actions,
  trailing,
}: TabPageHeaderProps) => {
  const classes = useStyles();
  const accentColor = PAGE_HEADER_ACCENTS[accent];

  return (
    <Paper
      className={classes.hero}
      elevation={0}
      style={{ borderLeftColor: accentColor }}
    >
      <Box className={classes.heroContent}>
        <Box className={classes.titleBlock}>
          {(icon || iconSrc) && (
            <Box className={classes.iconWrap}>
              {iconSrc ? (
                <img
                  src={iconSrc}
                  alt={iconAlt}
                  className={classes.iconImage}
                />
              ) : (
                icon
              )}
            </Box>
          )}
          <Box minWidth={0}>
            <Typography component="h1" className={classes.title}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" className={classes.subtitle}>
                {subtitle}
              </Typography>
            )}
            {chips && <Box className={classes.metaRow}>{chips}</Box>}
          </Box>
        </Box>
        {(actions || trailing) && (
          <Box className={classes.actions}>
            {actions}
            {trailing}
          </Box>
        )}
      </Box>
    </Paper>
  );
};
