import React from 'react';
import { Grid, Paper, Typography, makeStyles } from '@material-ui/core';
import { ArgoCdApplication } from './types';
import { StatusChip } from './StatusChip';

const useStyles = makeStyles(theme => ({
  paper: {
    padding: theme.spacing(2),
    height: '100%',
  },
  label: {
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(0.5),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 12,
    fontWeight: 700,
  },
  value: {
    fontWeight: 700,
    wordBreak: 'break-word',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing(2),
    gap: theme.spacing(1),
  },
}));

type Props = {
  application: ArgoCdApplication;
};

export const SummaryCards = ({ application }: Props) => {
  const classes = useStyles();

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={8}>
        <Paper className={classes.paper}>
          <div className={classes.header}>
            <div>
              <Typography variant="h6">{application.name}</Typography>
              <Typography color="textSecondary">
                Argo CD application session
              </Typography>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <StatusChip label={application.health} />
              <StatusChip label={application.sync} />
            </div>
          </div>
          <Grid container spacing={2}>
            {application.summary.map(item => (
              <Grid item xs={12} sm={6} md={3} key={item.label}>
                <Typography className={classes.label}>{item.label}</Typography>
                <Typography className={classes.value}>{item.value}</Typography>
                {item.detail ? (
                  <Typography variant="body2" color="textSecondary">
                    {item.detail}
                  </Typography>
                ) : null}
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Grid>
      <Grid item xs={12} md={4}>
        <Paper className={classes.paper}>
          <Typography variant="h6" gutterBottom>
            Deployment state
          </Typography>
          <Typography className={classes.label}>Health</Typography>
          <StatusChip label={application.health} />
          <div style={{ height: 12 }} />
          <Typography className={classes.label}>Sync</Typography>
          <StatusChip label={application.sync} />
        </Paper>
      </Grid>
    </Grid>
  );
};
