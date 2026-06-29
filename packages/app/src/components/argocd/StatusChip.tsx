import React from 'react';
import { Chip, makeStyles } from '@material-ui/core';
import {
  ArgoCdHealthStatus,
  ArgoCdOperationStatus,
  ArgoCdSyncStatus,
} from './types';

const useStyles = makeStyles(theme => ({
  root: {
    fontWeight: 700,
  },
  healthy: {
    background: theme.palette.success.light,
    color: theme.palette.success.dark,
  },
  progressing: {
    background: theme.palette.info.light,
    color: theme.palette.info.dark,
  },
  degraded: {
    background: theme.palette.error.light,
    color: theme.palette.error.dark,
  },
  suspended: {
    background: theme.palette.action.disabledBackground,
    color: theme.palette.text.secondary,
  },
  synced: {
    background: theme.palette.success.light,
    color: theme.palette.success.dark,
  },
  outOfSync: {
    background: theme.palette.warning.light,
    color: theme.palette.warning.dark,
  },
  unknown: {
    background: theme.palette.action.selected,
    color: theme.palette.text.secondary,
  },
  succeeded: {
    background: theme.palette.success.light,
    color: theme.palette.success.dark,
  },
  running: {
    background: theme.palette.info.light,
    color: theme.palette.info.dark,
  },
  failed: {
    background: theme.palette.error.light,
    color: theme.palette.error.dark,
  },
  skipped: {
    background: theme.palette.action.selected,
    color: theme.palette.text.secondary,
  },
}));

type Props = {
  label: ArgoCdHealthStatus | ArgoCdSyncStatus | ArgoCdOperationStatus;
};

export const StatusChip = ({ label }: Props) => {
  const classes = useStyles();
  const key = label
    .replace(/\s+/g, '')
    .replace(/^[A-Z]/, char => char.toLowerCase());
  const statusClass = classes[key as keyof typeof classes];
  return (
    <Chip
      size="small"
      label={label}
      className={`${classes.root} ${statusClass ?? ''}`.trim()}
    />
  );
};
