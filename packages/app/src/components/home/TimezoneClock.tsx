import React, { useEffect, useState } from 'react';
import { Box, Typography, Divider } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  root: {
    position: 'fixed',
    top: 8,
    right: 16,

    display: 'flex',
    alignItems: 'center',

    background: '#151A21',
    borderRadius: 8,
    padding: '4px 8px',

    boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
    border: '1px solid rgba(255,255,255,0.08)',

    zIndex: 9999,
  },

  zone: {
    minWidth: 100,
    padding: '0 10px',
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 4,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    marginRight: 5,
  },

  label: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: 600,
  },

  time: {
    fontSize: 13,
    fontWeight: 600,
    color: '#fff',
    lineHeight: 1.2,
  },

  city: {
    marginTop: 2,
    fontSize: 10,
    color: '#B0B8C5',
  },

  divider: {
    height: 42,
    background: 'rgba(255,255,255,0.08)',
  },
}));

export const TimezoneClock = () => {
  const classes = useStyles();

  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      forceUpdate(v => v + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const zones = [
    {
      label: 'IST',
      zone: 'Asia/Kolkata',
      color: '#34D058',
    },
    {
      label: 'PST',
      zone: 'America/Los_Angeles',
      color: '#FBBF24',
    },
    {
      label: 'UTC',
      zone: 'Europe/London',
      color: '#3B82F6',
    },
    {
      label: 'CET',
      zone: 'Europe/Berlin',
      color: '#8B5CF6',
    },
  ];

  return (
    <Box className={classes.root}>
      {zones.map((item, index) => (
        <React.Fragment key={item.label}>
          <Box className={classes.zone}>
            <Box className={classes.header}>
              <Box
                className={classes.dot}
                style={{ background: item.color }}
              />

              <Typography className={classes.label}>
                {item.label}
              </Typography>
            </Box>

            <Typography className={classes.time}>
              {new Intl.DateTimeFormat('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
                timeZone: item.zone,
              }).format(new Date())}
            </Typography>

            <Typography className={classes.city}>
              {item.zone}
            </Typography>
          </Box>

          {index < zones.length - 1 && (
            <Divider
              orientation="vertical"
              flexItem
              className={classes.divider}
            />
          )}
        </React.Fragment>
      ))}
    </Box>
  );
};