import React, { useMemo } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import { DateTime } from 'luxon';

export type CoverageDataPoint = {
  date: string;
  value: number;
};

type CoverageTrendChartProps = {
  data: CoverageDataPoint[];
  width?: number;
  height?: number;
};

const useStyles = makeStyles(theme => ({
  root: {
    width: '100%',
  },
  chart: {
    display: 'block',
    width: '100%',
    maxWidth: '100%',
  },
  empty: {
    color: theme.palette.text.secondary,
    padding: theme.spacing(4, 0),
    textAlign: 'center',
  },
  axisLabel: {
    fill: theme.palette.text.secondary,
    fontSize: 11,
  },
  gridLine: {
    stroke: theme.palette.divider,
    strokeWidth: 1,
  },
  line: {
    fill: 'none',
    stroke: theme.palette.primary.main,
    strokeWidth: 2,
  },
  area: {
    fill: theme.palette.primary.main,
    opacity: 0.08,
  },
  dot: {
    fill: theme.palette.primary.main,
  },
}));

const CHART_PADDING = { top: 16, right: 16, bottom: 32, left: 40 };

function buildPath(points: Array<{ x: number; y: number }>): string {
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
}

function buildAreaPath(
  points: Array<{ x: number; y: number }>,
  baselineY: number,
): string {
  if (points.length === 0) {
    return '';
  }
  const line = buildPath(points);
  const last = points[points.length - 1];
  const first = points[0];
  return `${line} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
}

export const CoverageTrendChart = ({
  data,
  width = 640,
  height = 220,
}: CoverageTrendChartProps) => {
  const classes = useStyles();

  const chart = useMemo(() => {
    const sorted = [...data].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    if (sorted.length === 0) {
      return null;
    }

    const innerWidth = width - CHART_PADDING.left - CHART_PADDING.right;
    const innerHeight = height - CHART_PADDING.top - CHART_PADDING.bottom;
    const values = sorted.map(point => point.value);
    const minValue = Math.max(0, Math.min(...values) - 5);
    const maxValue = Math.min(100, Math.max(...values) + 5);
    const valueRange = maxValue - minValue || 1;

    const points = sorted.map((point, index) => {
      const x =
        CHART_PADDING.left +
        (sorted.length === 1
          ? innerWidth / 2
          : (index / (sorted.length - 1)) * innerWidth);
      const y =
        CHART_PADDING.top +
        innerHeight -
        ((point.value - minValue) / valueRange) * innerHeight;
      return { x, y, point };
    });

    const baselineY = CHART_PADDING.top + innerHeight;
    const yTicks = [minValue, (minValue + maxValue) / 2, maxValue];
    const firstLabel = DateTime.fromISO(sorted[0].date).toFormat('MMM d');
    const lastLabel = DateTime.fromISO(sorted[sorted.length - 1].date).toFormat(
      'MMM d',
    );

    return {
      points,
      baselineY,
      yTicks,
      firstLabel,
      lastLabel,
      minValue,
      maxValue,
    };
  }, [data, height, width]);

  if (!chart) {
    return (
      <Typography variant="body2" className={classes.empty}>
        No coverage history available
      </Typography>
    );
  }

  const {
    points,
    baselineY,
    yTicks,
    firstLabel,
    lastLabel,
    minValue,
    maxValue,
  } = chart;

  return (
    <div className={classes.root}>
      <svg
        className={classes.chart}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Coverage trend chart"
      >
        {yTicks.map(tick => {
          const y =
            CHART_PADDING.top +
            (height - CHART_PADDING.top - CHART_PADDING.bottom) -
            ((tick - minValue) / (maxValue - minValue || 1)) *
              (height - CHART_PADDING.top - CHART_PADDING.bottom);
          return (
            <g key={tick}>
              <line
                className={classes.gridLine}
                x1={CHART_PADDING.left}
                y1={y}
                x2={width - CHART_PADDING.right}
                y2={y}
              />
              <text
                className={classes.axisLabel}
                x={CHART_PADDING.left - 8}
                y={y + 4}
                textAnchor="end"
              >
                {Math.round(tick)}%
              </text>
            </g>
          );
        })}

        <path
          className={classes.area}
          d={buildAreaPath(
            points.map(({ x, y }) => ({ x, y })),
            baselineY,
          )}
        />
        <path
          className={classes.line}
          d={buildPath(points.map(({ x, y }) => ({ x, y })))}
        />

        {points.map(({ x, y, point }) => (
          <circle key={point.date} className={classes.dot} cx={x} cy={y} r={3}>
            <title>
              {DateTime.fromISO(point.date).toFormat('MMM d, yyyy')}:{' '}
              {point.value.toFixed(1)}%
            </title>
          </circle>
        ))}

        <text
          className={classes.axisLabel}
          x={CHART_PADDING.left}
          y={height - 8}
        >
          {firstLabel}
        </text>
        <text
          className={classes.axisLabel}
          x={width - CHART_PADDING.right}
          y={height - 8}
          textAnchor="end"
        >
          {lastLabel}
        </text>
      </svg>
    </div>
  );
};
