import React from 'react';
import { Paper, Typography, makeStyles, Button } from '@material-ui/core';
import { GitHub } from '@material-ui/icons';
import { ArgoCdRepository } from './types';

const useStyles = makeStyles(theme => ({
  paper: { padding: theme.spacing(2), height: '100%' },
  meta: {
    display: 'grid',
    gap: theme.spacing(1),
    marginTop: theme.spacing(2),
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
  },
  label: { color: theme.palette.text.secondary },
  value: { fontWeight: 600, textAlign: 'right', wordBreak: 'break-word' },
}));

type Props = { repository: ArgoCdRepository };

export const RepositoryCard = ({ repository }: Props) => {
  const classes = useStyles();

  return (
    <Paper className={classes.paper}>
      <Typography variant="h6">Repository</Typography>
      <Button
        startIcon={<GitHub />}
        href={repository.url}
        target="_blank"
        rel="noreferrer"
        color="primary"
      >
        {repository.name}
      </Button>
      <div className={classes.meta}>
        <div className={classes.row}>
          <Typography className={classes.label}>Revision</Typography>
          <Typography className={classes.value}>
            {repository.revision}
          </Typography>
        </div>
        <div className={classes.row}>
          <Typography className={classes.label}>Namespace</Typography>
          <Typography className={classes.value}>
            {repository.namespace}
          </Typography>
        </div>
        <div className={classes.row}>
          <Typography className={classes.label}>Project</Typography>
          <Typography className={classes.value}>
            {repository.project}
          </Typography>
        </div>
        <div className={classes.row}>
          <Typography className={classes.label}>Cluster</Typography>
          <Typography className={classes.value}>
            {repository.cluster}
          </Typography>
        </div>
      </div>
    </Paper>
  );
};
