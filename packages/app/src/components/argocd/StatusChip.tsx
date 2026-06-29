import React from 'react';
import { Chip, makeStyles } from '@material-ui/core';
import {
  ARGO_STATUS_STYLES,
  ArgoStatusTone,
  getArgoStatusTone,
} from './argoTheme';

const useStyles = makeStyles({
  root: {
    fontWeight: 600,
    fontSize: '0.75rem',
    height: 24,
  },
});

type Props = {
  label: string;
  tone?: ArgoStatusTone;
};

export const StatusChip = ({ label, tone }: Props) => {
  const classes = useStyles();
  const resolvedTone = tone ?? getArgoStatusTone(label);
  const statusStyle = ARGO_STATUS_STYLES[resolvedTone];

  return (
    <Chip
      size="small"
      label={label}
      className={classes.root}
      style={{
        backgroundColor: statusStyle.background,
        color: statusStyle.color,
      }}
    />
  );
};
