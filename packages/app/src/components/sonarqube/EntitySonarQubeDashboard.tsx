import React, { useCallback, useMemo, useState } from 'react';
import { Box, Button, Chip, Grid, Paper, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import RefreshIcon from '@material-ui/icons/Refresh';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import BugReportIcon from '@material-ui/icons/BugReport';
import useAsync from 'react-use/esm/useAsync';
import { DateTime } from 'luxon';
import { EmptyState, Progress } from '@backstage/core-components';
import {
  discoveryApiRef,
  fetchApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import {
  MissingAnnotationEmptyState,
  useEntity,
} from '@backstage/plugin-catalog-react';
import {
  FindingSummary,
  sonarQubeApiRef,
  SONARQUBE_PROJECT_KEY_ANNOTATION,
  isSonarQubeAvailable,
  useProjectInfo,
} from '@backstage-community/plugin-sonarqube-react';
import { ResponseError } from '@backstage/errors';

import { CoverageTrendChart, CoverageDataPoint } from './CoverageTrendChart';
import { TabPageHeader } from '../common/TabPageHeader';
import { GSPANN_COLORS } from '../../theme/gspannBrand';

type MetricTone = 'success' | 'warning' | 'error' | 'neutral';

type MetricCardConfig = {
  key: string;
  label: string;
  value: string;
  tone: MetricTone;
};

type CoverageHistoryResponse = {
  measures?: Array<{
    metric: string;
    history?: Array<{
      date: string;
      value?: string;
    }>;
  }>;
};

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(3),
    maxWidth: 1200,
  },
  headerChip: {
    fontWeight: 600,
  },
  headerButton: {
    backgroundColor: '#ffffff',
    color: GSPANN_COLORS.navy,
    fontWeight: 600,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
    '&:hover': {
      backgroundColor: '#E8EEF5',
    },
  },
  headerButtonOutlined: {
    borderColor: GSPANN_COLORS.navy,
    color: GSPANN_COLORS.navy,
    fontWeight: 600,
    backgroundColor: '#ffffff',
    '&:hover': {
      borderColor: GSPANN_COLORS.burgundy,
      backgroundColor: GSPANN_COLORS.burgundyMuted,
    },
  },
  headerButtonPrimary: {
    backgroundColor: GSPANN_COLORS.burgundy,
    color: '#ffffff',
    fontWeight: 600,
    '&:hover': {
      backgroundColor: GSPANN_COLORS.burgundyLight,
    },
  },
  badgeLabel: {
    color: theme.palette.common.white,
  },
  badgeSuccess: {
    backgroundColor: theme.palette.success.main,
  },
  badgeError: {
    backgroundColor: theme.palette.error.main,
  },
  badgeUnknown: {
    backgroundColor: theme.palette.grey[500],
  },
  metricCard: {
    padding: theme.spacing(2),
    height: '100%',
  },
  metricLabel: {
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(1),
  },
  metricValue: {
    fontSize: '2rem',
    fontWeight: 500,
    lineHeight: 1.1,
  },
  metricSuccess: {
    color: theme.palette.success.main,
  },
  metricWarning: {
    color: theme.palette.warning.main,
  },
  metricError: {
    color: theme.palette.error.main,
  },
  metricNeutral: {
    color: theme.palette.text.primary,
  },
  trendSection: {
    marginTop: theme.spacing(3),
    padding: theme.spacing(2),
  },
}));

function countTone(value: number): MetricTone {
  if (value === 0) {
    return 'success';
  }
  if (value <= 5) {
    return 'warning';
  }
  return 'error';
}

function coverageTone(value: number | undefined): MetricTone {
  if (value === undefined || Number.isNaN(value)) {
    return 'neutral';
  }
  if (value >= 80) {
    return 'success';
  }
  if (value >= 50) {
    return 'warning';
  }
  return 'error';
}

function duplicationTone(value: number | undefined): MetricTone {
  if (value === undefined || Number.isNaN(value)) {
    return 'neutral';
  }
  if (value <= 3) {
    return 'success';
  }
  if (value <= 5) {
    return 'warning';
  }
  return 'error';
}

function parseNumber(value: string | undefined): number | undefined {
  if (value === undefined || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function buildMetricCards(summary: FindingSummary): MetricCardConfig[] {
  const bugs = parseNumber(summary.metrics.bugs) ?? 0;
  const vulnerabilities = parseNumber(summary.metrics.vulnerabilities) ?? 0;
  const codeSmells = parseNumber(summary.metrics.code_smells) ?? 0;
  const coverage = parseNumber(summary.metrics.coverage);
  const duplications = parseNumber(summary.metrics.duplicated_lines_density);
  const openIssues = bugs + vulnerabilities + codeSmells;

  return [
    {
      key: 'bugs',
      label: 'Bugs',
      value: String(bugs),
      tone: countTone(bugs),
    },
    {
      key: 'vulnerabilities',
      label: 'Vulnerabilities',
      value: String(vulnerabilities),
      tone: countTone(vulnerabilities),
    },
    {
      key: 'coverage',
      label: 'Coverage',
      value: coverage !== undefined ? `${coverage.toFixed(1)}%` : '—',
      tone: coverageTone(coverage),
    },
    {
      key: 'code-smells',
      label: 'Code Smells',
      value: String(codeSmells),
      tone: countTone(codeSmells),
    },
    {
      key: 'duplications',
      label: 'Duplications',
      value: duplications !== undefined ? `${duplications.toFixed(1)}%` : '—',
      tone: duplicationTone(duplications),
    },
    {
      key: 'open-issues',
      label: 'Open Issues',
      value: String(openIssues),
      tone: countTone(openIssues),
    },
  ];
}

async function fetchCoverageHistory(
  discoveryApi: { getBaseUrl(id: string): Promise<string> },
  fetchApi: {
    fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;
  },
  projectKey: string,
): Promise<CoverageDataPoint[]> {
  const proxyBase = await discoveryApi.getBaseUrl('proxy');
  const url = `${proxyBase}/sonarqube/measures/search_history?${new URLSearchParams(
    {
      component: projectKey,
      metrics: 'coverage',
      ps: '1000',
    },
  ).toString()}`;

  const response = await fetchApi.fetch(url);
  if (!response.ok) {
    throw await ResponseError.fromResponse(response);
  }

  const body = (await response.json()) as CoverageHistoryResponse;
  const coverageMeasure = body.measures?.find(
    measure => measure.metric === 'coverage',
  );

  return (
    coverageMeasure?.history
      ?.filter(entry => entry.value !== undefined)
      .map(entry => ({
        date: entry.date,
        value: Number(entry.value),
      }))
      .filter(entry => !Number.isNaN(entry.value)) ?? []
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: MetricTone;
}) {
  const classes = useStyles();
  const toneClass =
    tone === 'success'
      ? classes.metricSuccess
      : tone === 'warning'
      ? classes.metricWarning
      : tone === 'error'
      ? classes.metricError
      : classes.metricNeutral;

  return (
    <Paper className={classes.metricCard} elevation={1}>
      <Typography variant="subtitle2" className={classes.metricLabel}>
        {label}
      </Typography>
      <Typography
        component="div"
        className={`${classes.metricValue} ${toneClass}`}
      >
        {value}
      </Typography>
    </Paper>
  );
}

function DashboardError({ error }: { error: Error }) {
  const statusCode =
    'statusCode' in error ? (error as ResponseError).statusCode : undefined;

  if (statusCode === 401) {
    return (
      <EmptyState
        missing="info"
        title="Unauthorized"
        description="Your authentication token for SonarQube is missing or invalid."
      />
    );
  }
  if (statusCode === 403) {
    return (
      <EmptyState
        missing="info"
        title="Access denied"
        description="Your SonarQube token does not have sufficient permissions to access this project."
      />
    );
  }
  if (statusCode === 404) {
    return (
      <EmptyState
        missing="info"
        title="SonarQube project not found"
        description="The sonarqube.org/project-key annotation may be invalid or the project does not exist."
      />
    );
  }

  return (
    <EmptyState
      missing="info"
      title="Unable to load SonarQube data"
      description={error.message}
    />
  );
}

export const EntitySonarQubeDashboard = () => {
  const classes = useStyles();
  const { entity } = useEntity();
  const sonarQubeApi = useApi(sonarQubeApiRef);
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const { projectKey } = useProjectInfo(entity);
  const [refreshKey, setRefreshKey] = useState(0);

  const {
    value: summary,
    error: summaryError,
    loading: summaryLoading,
  } = useAsync(async () => {
    return sonarQubeApi.getSummaries([entity]).then(results => results[0]);
  }, [sonarQubeApi, entity, refreshKey]);

  const {
    value: coverageHistory,
    error: coverageError,
    loading: coverageLoading,
  } = useAsync(async () => {
    if (!projectKey) {
      return [];
    }
    return fetchCoverageHistory(discoveryApi, fetchApi, projectKey);
  }, [discoveryApi, fetchApi, projectKey, refreshKey]);

  const handleRefresh = useCallback(() => {
    setRefreshKey(key => key + 1);
  }, []);

  const metricCards = useMemo(
    () => (summary ? buildMetricCards(summary) : []),
    [summary],
  );

  const gatePassed = summary?.metrics.alert_status === 'OK';
  const gateLabel = summary?.metrics.alert_status
    ? gatePassed
      ? 'OK'
      : 'Failed'
    : 'Not computed';

  const gateClass = summary?.metrics.alert_status
    ? gatePassed
      ? classes.badgeSuccess
      : classes.badgeError
    : classes.badgeUnknown;

  if (summaryLoading && !summary) {
    return <Progress />;
  }

  if (!isSonarQubeAvailable(entity)) {
    return (
      <MissingAnnotationEmptyState
        annotation={SONARQUBE_PROJECT_KEY_ANNOTATION}
      />
    );
  }

  if (summaryError) {
    return <DashboardError error={summaryError} />;
  }

  if (!summary) {
    return (
      <EmptyState
        missing="info"
        title="No SonarQube data"
        description={`There is no SonarQube project with key '${
          projectKey ?? ''
        }'.`}
      />
    );
  }

  const reviewIssuesUrl = summary.projectUrl
    .replace('dashboard?', 'project/issues?')
    .concat('&resolved=false');

  return (
    <Box className={classes.root}>
      <TabPageHeader
        title={summary.title}
        subtitle={
          summary.lastAnalysis
            ? `Last analysis ${DateTime.fromISO(
                summary.lastAnalysis,
              ).toRelative({
                locale: 'en',
              })}`
            : 'Code quality metrics from SonarQube'
        }
        icon={<BugReportIcon style={{ color: '#4B9FD5', fontSize: 36 }} />}
        accent="sonarqube"
        chips={
          <Chip
            label={gateLabel}
            classes={{ root: gateClass, label: classes.badgeLabel }}
            size="small"
            className={classes.headerChip}
          />
        }
        actions={
          <>
            <Button
              variant="contained"
              className={classes.headerButton}
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={summaryLoading || coverageLoading}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              className={classes.headerButtonOutlined}
              startIcon={<OpenInNewIcon />}
              href={summary.projectUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              SonarQube
            </Button>
            <Button
              variant="contained"
              className={classes.headerButtonPrimary}
              startIcon={<BugReportIcon />}
              href={reviewIssuesUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Review Issues
            </Button>
          </>
        }
      />

      <Grid container spacing={2}>
        {metricCards.map(card => (
          <Grid item xs={12} sm={6} md={4} key={card.key}>
            <MetricCard
              label={card.label}
              value={card.value}
              tone={card.tone}
            />
          </Grid>
        ))}
      </Grid>

      <Paper className={classes.trendSection} elevation={1}>
        <Typography variant="h6" gutterBottom>
          Coverage Trend
        </Typography>
        {coverageLoading && !coverageHistory ? (
          <Progress />
        ) : coverageError ? (
          <Typography variant="body2" color="error">
            Unable to load coverage history: {coverageError.message}
          </Typography>
        ) : (
          <CoverageTrendChart data={coverageHistory ?? []} />
        )}
      </Paper>
    </Box>
  );
};
