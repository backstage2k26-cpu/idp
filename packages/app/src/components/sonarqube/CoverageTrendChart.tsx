import React, { useMemo, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import { DateTime } from 'luxon';
import { GSPANN_COLORS } from '../../theme/gspannBrand';

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
    position: 'relative',
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
    fill: '#7B879C',
    fontSize: 8.5,
    fontFamily: '"Arial", "Helvetica", sans-serif',
  },
  gridLine: {
    stroke: '#DCE6F3',
    strokeWidth: 1,
    strokeDasharray: '4 6',
  },
  line: {
    fill: 'none',
    stroke: '#2563FF',
    strokeWidth: 2,
  },
  dot: {
    fill: '#2563FF',
  },
  activeDot: {
    fill: '#2563FF',
  },
  hoverLine: {
    stroke: '#5E6F8E',
    strokeWidth: 1,
    strokeDasharray: '6 6',
  },
  tooltip: {
    position: 'absolute',
    minWidth: 120,
    background: GSPANN_COLORS.textPrimary,
    color: '#ffffff',
    borderRadius: 16,
    padding: theme.spacing(2),
    pointerEvents: 'none',
    boxShadow: '0 14px 30px rgba(11, 31, 58, 0.18)',
    transform: 'translate(-50%, -100%)',
    zIndex: 2,
  },
  tooltipDate: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: '"Roboto Mono", monospace',
    marginBottom: theme.spacing(1),
  },
  tooltipValue: {
    fontSize: 18,
    fontWeight: 700,
    lineHeight: 1.1,
    marginBottom: theme.spacing(0.5),
  },
  tooltipLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: '"Roboto Mono", monospace',
  },
}));

const CHART_PADDING = { top: 20, right: 20, bottom: 36, left: 44 };

function buildPath(points: Array<{ x: number; y: number }>): string {
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
}

export const CoverageTrendChart = ({
  data,
  width = 640,
  height = 150,
}: CoverageTrendChartProps) => {
  const classes = useStyles();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const chart = useMemo(() => {
    const sorted = [...data].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    if (sorted.length === 0) {
      return null;
    }

    const innerWidth = width - CHART_PADDING.left - CHART_PADDING.right;
    const innerHeight = height - CHART_PADDING.top - CHART_PADDING.bottom;
    const minValue = 0;
    const maxValue = 100;
    const valueRange = 100;

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
    const yTicks = [0, 50, 100];
    const firstLabel = DateTime.fromISO(sorted[0].date).toFormat('MMM d');
    const middleLabel = DateTime.fromISO(
      sorted[Math.floor(sorted.length / 2)].date,
    ).toFormat('MMM d');
    const lastLabel = DateTime.fromISO(sorted[sorted.length - 1].date).toFormat(
      'MMM d',
    );

    return {
      points,
      baselineY,
      yTicks,
      firstLabel,
      middleLabel,
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
    middleLabel,
    lastLabel,
    minValue,
    maxValue,
  } = chart;

  const activePoint =
    activeIndex !== null && points[activeIndex] ? points[activeIndex] : null;

  return (
    <div className={classes.root} onMouseLeave={() => setActiveIndex(null)}>
      {activePoint && (
        <Box
          className={classes.tooltip}
          style={{
            left: Math.min(Math.max(activePoint.x, 88), width - 88),
            top: Math.max(activePoint.y - 14, 88),
          }}
        >
          <Typography className={classes.tooltipDate}>
            {DateTime.fromISO(activePoint.point.date).toFormat('MMM d')}
          </Typography>
          <Typography className={classes.tooltipValue}>
            {activePoint.point.value.toFixed(0)}%
          </Typography>
          <Typography className={classes.tooltipLabel}>Coverage</Typography>
        </Box>
      )}
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
          className={classes.line}
          d={buildPath(points.map(({ x, y }) => ({ x, y })))}
        />

        {activePoint && (
          <line
            className={classes.hoverLine}
            x1={activePoint.x}
            y1={CHART_PADDING.top}
            x2={activePoint.x}
            y2={baselineY}
          />
        )}

        {points.map(({ x, y, point }, index) => (
          <g
            key={point.date}
            onMouseEnter={() => setActiveIndex(index)}
            onFocus={() => setActiveIndex(index)}
          >
            <circle
              cx={x}
              cy={y}
              r={12}
              fill="transparent"
              style={{ cursor: 'pointer' }}
            />
            <circle
              className={
                activeIndex === index ? classes.activeDot : classes.dot
              }
              cx={x}
              cy={y}
              r={activeIndex === index ? 4 : 2.4}
            />
          </g>
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
          x={width / 2}
          y={height - 8}
          textAnchor="middle"
        >
          {middleLabel}
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
