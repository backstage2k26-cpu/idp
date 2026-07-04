import { useEffect, useMemo, useState } from 'react';
import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import { GSPANN_COLORS, HOME_WIDGET_THEME } from '../../theme/gspannBrand';

type ZoneConfig = {
  label: string;
  zone: string;
  color: string;
};

const ZONES: ZoneConfig[] = [
  {
    label: 'IST',
    zone: 'Asia/Kolkata',
    color: HOME_WIDGET_THEME.zoneColors.ist,
  },
  {
    label: 'PST',
    zone: 'America/Los_Angeles',
    color: HOME_WIDGET_THEME.zoneColors.pst,
  },
  {
    label: 'EST',
    zone: 'America/New_York',
    color: HOME_WIDGET_THEME.zoneColors.est,
  },
  { label: 'UTC', zone: 'UTC', color: HOME_WIDGET_THEME.zoneColors.utc },
  {
    label: 'EUROPE',
    zone: 'Europe/Berlin',
    color: HOME_WIDGET_THEME.zoneColors.europe,
  },
];

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1.5, 2),
    width: 'fit-content',
    maxWidth: '100%',
  },
  embedded: {
    gap: theme.spacing(1, 1.75),
    justifyContent: 'flex-end',
    [theme.breakpoints.down('xs')]: {
      justifyContent: 'center',
      width: '100%',
    },
  },
  zone: {
    minWidth: 52,
    textAlign: 'left',
  },
  zoneEmbedded: {
    minWidth: 48,
    [theme.breakpoints.down('xs')]: {
      textAlign: 'center',
      minWidth: 44,
    },
  },
  label: {
    fontWeight: 700,
    fontSize: '0.6875rem',
    color: GSPANN_COLORS.navy,
    lineHeight: 1.2,
    marginBottom: 0,
    letterSpacing: '0.03em',
  },
  labelEmbedded: {
    fontSize: '0.625rem',
  },
  labelRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 1,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: '50%',
    marginRight: theme.spacing(0.5),
    flexShrink: 0,
  },
  time: {
    fontWeight: 500,
    fontSize: '0.75rem',
    color: GSPANN_COLORS.navyMid,
    lineHeight: 1.2,
    fontVariantNumeric: 'tabular-nums',
  },
  timeEmbedded: {
    fontSize: '0.6875rem',
  },
}));

const formatTime = (date: Date, zone: string) =>
  new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: zone,
  }).format(date);

type TimezoneClockProps = {
  embedded?: boolean;
};

export const TimezoneClock = ({ embedded = false }: TimezoneClockProps) => {
  const classes = useStyles();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const times = useMemo(
    () =>
      ZONES.map(zone => ({
        ...zone,
        time: formatTime(now, zone.zone),
      })),
    [now],
  );

  return (
    <Box
      className={classNames(classes.root, embedded && classes.embedded)}
      component="section"
      aria-label="World clock"
    >
      {times.map(item => (
        <Box
          key={item.zone}
          className={classNames(classes.zone, embedded && classes.zoneEmbedded)}
        >
          <Box className={classes.labelRow}>
            <Box
              className={classes.dot}
              style={{ backgroundColor: item.color }}
              aria-hidden
            />
            <Typography
              className={classNames(
                classes.label,
                embedded && classes.labelEmbedded,
              )}
              component="span"
            >
              {item.label}
            </Typography>
          </Box>
          <Typography
            className={classNames(
              classes.time,
              embedded && classes.timeEmbedded,
            )}
            aria-live="polite"
          >
            {item.time}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};
