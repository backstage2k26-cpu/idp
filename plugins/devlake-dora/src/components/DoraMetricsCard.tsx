import React, { useEffect, useState } from 'react';
import { Progress } from '@backstage/core-components';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { DoraMetrics, getDoraMetrics } from '../api';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useEntity } from '@backstage/plugin-catalog-react';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ScheduleIcon from '@mui/icons-material/Schedule';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import HistoryIcon from '@mui/icons-material/History';

type DoraEnvironment = {
  key: 'dev' | 'qa' | 'prod';
  label: string;
  application: string;
};
const getDoraEnvironments = (entity: any): DoraEnvironment[] => {
  return ['dev', 'qa', 'prod']
    .map(key => {
      const application =
        entity.metadata.annotations?.[`platform.io/argocd-${key}`];

      return application
        ? {
            key: key as DoraEnvironment['key'],
            label: key.toUpperCase(),
            application,
          }
        : null;
    })
    .filter((env): env is DoraEnvironment => Boolean(env));
};
const formatLeadTime = (value: number | null) => {
  if (value === null || value === undefined) {
    return 'N/A';
  }

  if (value < 1) {
    return `${(value * 3600).toFixed(1)} sec`;
  }

  return `${value.toFixed(2)} hrs`;
};

const formatMinutes = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  const minutes = Number(value);

  if (!Number.isFinite(minutes) || minutes < 0) {
    return '—';
  }

  const totalSeconds = Math.round(minutes * 60);

  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }

  const totalMinutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (totalMinutes < 60) {
    return seconds ? `${totalMinutes}m ${seconds}s` : `${totalMinutes}m`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  if (hours < 24) {
    return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  return remainingHours ? `${days}d ${remainingHours}h` : `${days}d`;
};

const formatDeploymentTime = (value: string | null) => {
  if (!value) {
    return '—';
  }

  const normalizedValue =
    /z$/i.test(value) || /[+-]\d{2}:\d{2}$/.test(value)
      ? value
      : value.replace(' ', 'T') + 'Z';

  const date = new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const correctedDate = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(correctedDate);
};

type Props = {
  project: string;
};

type MetricCardProps = {
  title: string;
  value: string | number;
  subtitle: string;
  color: string;
  icon: React.ReactNode;
};

const MetricCard = ({
  title,
  value,
  subtitle,
  color,
  icon,
}: MetricCardProps) => (
  <Card
    elevation={0}
    sx={{
      height: '100%',
      minHeight: 168,
      borderRadius: 3,
      border: '1px solid rgba(15, 23, 42, 0.08)',
      borderTop: `5px solid ${color}`,
      background: 'linear-gradient(180deg, #FFFFFF 0%, #FBFCFE 100%)',
      boxShadow: '0 6px 18px rgba(15,23,42,.05)',
      overflow: 'hidden',

      '&:hover': {
        transform: 'translateY(-1px)',
        boxShadow: '0 10px 24px rgba(15,23,42,.08)',
      },
    }}
  >
    <CardContent
      sx={{
        p: 2.5,
        pb: 2.25,
        '&:last-child': { pb: 2.25 },
      }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
        gap={2}
      >
        <Typography
          sx={{
            fontSize: 14,
            fontWeight: 700,
            color: '#1B2B4A',
            lineHeight: 1.2,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          {title}
        </Typography>

        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 2,
            background: `${color}14`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
      </Box>

      <Typography
        sx={{
          mt: 2,
          fontSize: 36,
          fontWeight: 700,
          color,
          lineHeight: 1,
          letterSpacing: '-0.03em',
        }}
      >
        {value}
      </Typography>

      <Typography
        color="text.secondary"
        sx={{
          mt: 1.25,
          fontSize: 14,
          color: '#6B7280',
          fontWeight: 400,
        }}
      >
        {subtitle}
      </Typography>
    </CardContent>
  </Card>
);

type ReleaseStatus = 'success' | 'in progress' | 'failed' | 'unknown';

const getReleaseStatus = (status: string): ReleaseStatus => {
  const normalized = status.trim().toLowerCase();

  if (
    normalized.includes('progress') ||
    normalized.includes('pending') ||
    normalized.includes('waiting')
  ) {
    return 'in progress';
  }

  if (normalized.includes('fail') || normalized.includes('error')) {
    return 'failed';
  }

  if (normalized.includes('success') || normalized.includes('synced')) {
    return 'success';
  }

  return 'unknown';
};

const ReleaseStatusChip = ({ status }: { status: string }) => {
  const releaseStatus = getReleaseStatus(status);
  const normalizedStatus = status.trim().toLowerCase();

  const palette =
    releaseStatus === 'success'
      ? {
          bg: '#E7F8F1',
          border: '#9DEBC2',
          color: '#0F6A44',
          icon: '✓',
        }
      : releaseStatus === 'failed'
      ? {
          bg: '#FFF0EE',
          border: '#FFC1B9',
          color: '#B42318',
          icon: '×',
        }
      : releaseStatus === 'in progress'
      ? {
          bg: '#FFF0F5',
          border: '#F7A7C0',
          color: '#F51B63',
          icon: '•',
        }
      : {
          bg: '#F3F5F8',
          border: '#D6DCE7',
          color: '#526987',
          icon: '•',
        };

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        px: 2,
        py: 0.8,
        borderRadius: '999px',
        border: `1px solid ${palette.border}`,
        backgroundColor: palette.bg,
        color: palette.color,
        fontWeight: 700,
        fontSize: 13,
        whiteSpace: 'nowrap',
      }}
    >
      <Box
        component="span"
        sx={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          lineHeight: 1,
          color: palette.color,
          border: `2px solid ${palette.color}`,
        }}
      >
        {palette.icon}
      </Box>
      {normalizedStatus.includes('waiting')
        ? status
        : releaseStatus === 'success'
        ? 'Success'
        : releaseStatus === 'failed'
        ? 'Failed'
        : releaseStatus === 'in progress'
        ? 'In Progress'
        : status}
    </Box>
  );
};

export const DoraMetricsCard = ({ project }: Props) => {
  const { entity } = useEntity();

  const environments = React.useMemo(
    () => getDoraEnvironments(entity),
    [entity],
  );

  const [tab, setTab] = React.useState(0);
  const isHistoryTab = tab === 3;

  const selectedEnvironment = environments[tab] ?? environments[0];
  const [metrics, setMetrics] = useState<DoraMetrics>();

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string>();
  const hasDeploymentMetrics = (metrics?.dora.deploymentFrequency ?? 0) > 0;
  const releasePromotions = metrics?.releasePromotions ?? [];

  useEffect(() => {
    setLoading(true);

    getDoraMetrics(project, selectedEnvironment?.application)
      .then(setMetrics)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [project, selectedEnvironment]);

  if (loading) {
    return <Progress />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!metrics) {
    return <Alert severity="info">No metrics available.</Alert>;
  }

  return (
    <Box
      sx={{
        background: '#F5F8FC',
        minHeight: '100vh',
        px: { xs: 1.25, md: 2.5, xl: 3.5 },
        py: { xs: 1.5, md: 2.5 },
      }}
    >
      {/* Header */}

      <Stack
        direction="row"
        spacing={2.25}
        alignItems="center"
        sx={{ mb: 2.5 }}
      >
        <Box
          sx={{
            width: 60,
            height: 60,
            bgcolor: '#005DFF',
            borderRadius: 3,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            boxShadow: '0 10px 20px rgba(239,75,55,.25)',
          }}
        >
          <TrendingUpIcon sx={{ fontSize: 32 }} />
        </Box>

        <Box>
          <Typography
            sx={{
              fontSize: { xs: 26, md: 32 },
              fontWeight: 800,
              color: '#0B1F3A',
              letterSpacing: '-0.8px',
              lineHeight: 1.1,
            }}
          >
            DORA Metrics
          </Typography>

          <Typography
            sx={{
              mt: 0.75,
              fontSize: 15,
              fontWeight: 500,
              letterSpacing: '-.2px',
              color: '#526987',
            }}
          >
            DevOps Research and Assessment — deployment performance insights
          </Typography>
        </Box>
      </Stack>

      <Card
        elevation={2}
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid rgba(15, 23, 42, 0.08)',
          boxShadow: '0 10px 24px rgba(15,23,42,.06)',
          bgcolor: '#FFFFFF',
        }}
      >
        <Stack spacing={2}>
          {/* Environment Tabs */}
          {environments.length > 0 && (
            <Box>
              <Tabs
                value={tab}
                onChange={(_, value) => setTab(value)}
                sx={{
                  px: { xs: 1, md: 1.25 },
                  pt: { xs: 1, md: 1.25 },
                  borderBottom: '1px solid rgba(15, 23, 42, 0.08)',

                  '& .MuiTabs-indicator': {
                    backgroundColor: '#F04E37',
                    height: 4,
                    borderRadius: '5px 5px 0 0',
                  },

                  '& .MuiTab-root': {
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    letterSpacing: 1.2,
                    fontSize: { xs: 15, md: 18 },
                    color: '#25466F',
                    minWidth: { xs: 100, md: 150 },
                    minHeight: { xs: 54, md: 64 },
                    borderRadius: '18px 18px 0 0',
                    px: 3,
                    fontFamily: 'monospace',
                    transition: 'background-color 160ms ease, color 160ms ease',
                  },

                  '& .Mui-selected': {
                    color: '#F04E37',
                    backgroundColor: '#FFF1EE',
                  },
                }}
              >
                {environments.map(env => (
                  <Tab key={env.key} label={env.label} />
                ))}

                <Tab
                  label={
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <HistoryIcon sx={{ fontSize: 20 }} />
                      <span>RELEASE HISTORY</span>
                    </Box>
                  }
                  sx={{
                    minWidth: 220,
                  }}
                />
              </Tabs>
            </Box>
          )}

          {isHistoryTab && (
            <Card
              elevation={1}
              sx={{
                borderRadius: 3,
                mx: { xs: 1, md: 1.25 },
                border: '1px solid rgba(15, 23, 42, 0.08)',
                background: '#FFFFFF',
                overflow: 'hidden',
                fontFamily: 'Arial, Helvetica, sans-serif',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: { xs: 2, md: 3 },
                  py: { xs: 2, md: 2.5 },
                  borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
                }}
              >
                <Typography
                  sx={{
                    fontSize: 18,
                    fontWeight: 800,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: '#000000',
                    fontFamily: 'Arial, Helvetica, sans-serif',
                  }}
                >
                  Release Promotion History
                </Typography>

                <Chip
                  label={`${releasePromotions.length} releases`}
                  sx={{
                    borderRadius: '999px',
                    px: 0.5,
                    height: 38,
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#000000',
                    backgroundColor: '#E8EDF7',
                  }}
                />
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow
                      sx={{
                        backgroundColor: '#F7F9FC',
                        '& th': {
                          borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
                          color: '#000000',
                          fontWeight: 800,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          fontSize: 16,
                          py: 2,
                          fontFamily: 'Arial, Helvetica, sans-serif',
                        },
                      }}
                    >
                      <TableCell sx={{ pl: { xs: 2, md: 3 } }}>
                        <Box sx={{ maxWidth: 100 }}>Version</Box>
                      </TableCell>
                      <TableCell align="center">
                        DEV
                        <br />
                        DEPLOYED
                      </TableCell>
                      <TableCell align="center">
                        QA
                        <br />
                        DEPLOYED
                      </TableCell>
                      <TableCell align="center">
                        PROD
                        <br />
                        DEPLOYED
                      </TableCell>
                      <TableCell align="center">
                        DEV →
                        <br />
                        QA
                      </TableCell>
                      <TableCell align="center">
                        QA →
                        <br />
                        PROD
                      </TableCell>
                      <TableCell align="center">
                        DEV →
                        <br />
                        PROD
                      </TableCell>
                      <TableCell align="right" sx={{ pr: { xs: 2, md: 3 } }}>
                        Status
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {releasePromotions.map((release, index) => (
                      <TableRow
                        key={`${release.imageVersion}-${index}`}
                        sx={{
                          '& td': {
                            borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
                            py: 2.6,
                            fontSize: 17,
                            color: '#0B1F3A',
                          },
                          '&:last-child td': {
                            borderBottom: 'none',
                          },
                        }}
                      >
                        <TableCell sx={{ pl: { xs: 2, md: 3 } }}>
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              px: 1.75,
                              py: 0.9,
                              borderRadius: '14px',
                              border: '1px solid #7DAAFD',
                              backgroundColor: '#E2ECFF',
                              color: '#005DFF',
                              fontWeight: 800,
                              fontSize: 12,
                              letterSpacing: '0.08em',
                              fontFamily: 'monospace',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {release.imageVersion}
                          </Box>
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            fontSize: 15,
                            fontFamily: 'Arial, Helvetica, sans-serif',
                            fontWeight: 400,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {formatDeploymentTime(release.devDeployed)}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            fontSize: 15,
                            fontFamily: 'Arial, Helvetica, sans-serif',
                            fontWeight: 400,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {formatDeploymentTime(release.qaDeployed)}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            fontSize: 15,
                            fontFamily: 'Arial, Helvetica, sans-serif',
                            fontWeight: 400,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {formatDeploymentTime(release.prodDeployed)}
                        </TableCell>
                        <TableCell align="center">
                          {formatMinutes(release.devToQaMinutes)}
                        </TableCell>
                        <TableCell align="center">
                          {formatMinutes(release.qaToProdMinutes)}
                        </TableCell>
                        <TableCell align="center">
                          {formatMinutes(release.devToProdMinutes)}
                        </TableCell>
                        <TableCell align="right" sx={{ pr: { xs: 2, md: 3 } }}>
                          <Box display="flex" justifyContent="flex-end">
                            <ReleaseStatusChip
                              status={release.promotionStatus}
                            />
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                    {releasePromotions.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          sx={{
                            py: 6,
                            textAlign: 'center',
                            color: '#6B7280',
                          }}
                        >
                          No release history available for this environment.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          )}

          {!isHistoryTab && (
            <>
              {/* ================= Repository ================= */}

              <Card
                elevation={1}
                sx={{
                  borderRadius: 3,
                  mx: { xs: 1.5, md: 2.5 },
                  border: '1px solid rgba(47, 99, 220, 0.08)',
                  background: '#FFFFFF',
                }}
              >
                <CardContent
                  sx={{
                    px: { xs: 2, md: 3 },
                    py: { xs: 2.5, md: 3.5 },
                  }}
                >
                  <Grid container spacing={2.25} alignItems="center">
                    {/* GitHub Repository */}
                    <Grid
                      item
                      xs={12}
                      md={4}
                      sx={{
                        pr: { md: 3 },
                      }}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          fontWeight: 500,
                          mb: 0.5,
                          color: '#6B7280',
                        }}
                      >
                        GitHub Repository
                      </Typography>

                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 600,
                          fontSize: '18px',
                          lineHeight: 1.2,
                          color: '#0B1F3A',
                        }}
                      >
                        {metrics.repository.githubRepo}
                      </Typography>
                    </Grid>

                    {/* ArgoCD Application */}
                    <Grid
                      item
                      xs={12}
                      md={4}
                      sx={{
                        px: { md: 3 },
                        borderLeft: { md: '1px solid #DCE2EC' },
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '15px',
                          fontWeight: 400,
                          color: '#6B7280',
                        }}
                      >
                        ArgoCD Application
                      </Typography>

                      <Typography
                        variant="h5"
                        sx={{
                          mt: 0.5,
                          fontWeight: 600,
                          fontSize: '18px',
                          lineHeight: 1.2,
                          color: '#0B1F3A',
                        }}
                      >
                        {hasDeploymentMetrics
                          ? metrics.repository.argoApplication
                          : 'Not onboarded'}
                      </Typography>
                    </Grid>

                    {/* Environment */}
                    <Grid
                      item
                      xs={12}
                      md={4}
                      sx={{
                        pl: { md: 3 },
                        borderLeft: { md: '1px solid #DCE2EC' },
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '15px',
                          fontWeight: 400,
                          color: '#6B7280',
                        }}
                      >
                        Environment
                      </Typography>

                      <Box mt={1}>
                        <Chip
                          label={
                            selectedEnvironment?.key === 'dev'
                              ? 'DEV'
                              : selectedEnvironment?.key === 'qa'
                              ? 'QA'
                              : selectedEnvironment?.key === 'prod'
                              ? 'PROD'
                              : 'UNKNOWN'
                          }
                          size="small"
                          variant="outlined"
                          sx={{
                            height: 28,
                            fontSize: 11,
                            fontWeight: 600,
                            borderRadius: '999px',
                            borderColor:
                              selectedEnvironment?.key === 'prod'
                                ? '#d32f2f'
                                : selectedEnvironment?.key === 'qa'
                                ? '#ed6c02'
                                : '#66bb6a',
                            color:
                              selectedEnvironment?.key === 'prod'
                                ? '#d32f2f'
                                : selectedEnvironment?.key === 'qa'
                                ? '#ed6c02'
                                : '#2e7d32',
                          }}
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* ================= Deployment Metrics ================= */}

              {hasDeploymentMetrics && (
                <Box>
                  <Typography
                    variant="h5"
                    sx={{
                      mb: 1.5,
                      fontWeight: 700,
                      color: '#0B1F3A',
                      letterSpacing: '-0.02em',
                      position: 'relative',
                      pl: 1.25,
                      '&:before': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: 7,
                        width: 5,
                        height: 28,
                        borderRadius: 2,
                        backgroundColor: '#005DFF',
                      },
                    }}
                  >
                    Deployment Metrics
                  </Typography>

                  <Grid container spacing={2} sx={{ px: { xs: 1, md: 1.25 } }}>
                    <Grid item xs={12} sm={6} md={4} sx={{ p: 1.75 }}>
                      <MetricCard
                        title="Deployments"
                        value={metrics.dora.deploymentFrequency}
                        subtitle="Last 7 days"
                        color="#F51B63"
                        icon={<TrendingUpIcon />}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6} md={4} sx={{ p: 1.75 }}>
                      <MetricCard
                        title="Lead Time"
                        value={formatLeadTime(metrics.dora.leadTime)}
                        subtitle="Commit → Deploy"
                        color="#2F80ED"
                        icon={<ScheduleIcon />}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6} md={4} sx={{ p: 1.75 }}>
                      <MetricCard
                        title="Failure Rate"
                        value={`${metrics.dora.changeFailureRate ?? 0}%`}
                        subtitle="Change failure rate"
                        color="#E85D4A"
                        icon={<WarningAmberIcon />}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {!hasDeploymentMetrics && (
                <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
                  No ArgoCD metrics are available for this environment because
                  this application has not been onboarded to ArgoCD/DevLake yet.
                </Alert>
              )}

              {/* Deployment Frequency */}

              <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
                <Grid
                  item
                  xs={12}
                  lg={6}
                  sx={{ px: { xs: 1, md: 1.25 }, py: 0.5 }}
                >
                  <Card
                    elevation={1}
                    sx={{
                      borderRadius: 3,
                      border: '1px solid rgba(15, 23, 42, 0.08)',
                      boxShadow: '0 6px 18px rgba(15,23,42,.05)',
                      background: '#FFFFFF',
                      height: '100%',
                      minHeight: 520,
                    }}
                  >
                    <CardContent
                      sx={{
                        p: { xs: 2, md: 2.25 },
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: '#1B2B4A',
                          mb: 1.5,
                          position: 'relative',
                          pl: 1.25,
                          '&:before': {
                            content: '""',
                            position: 'absolute',
                            left: 0,
                            top: 2,
                            width: 4,
                            height: 20,
                            borderRadius: 2,
                            backgroundColor: '#005DFF',
                          },
                        }}
                        fontWeight={700}
                        gutterBottom
                      >
                        Deployment Frequency - Last 7 Days
                      </Typography>

                      <ResponsiveContainer width="100%" height={420}>
                        <BarChart
                          data={metrics.deploymentTrend}
                          barCategoryGap="45%"
                        >
                          <CartesianGrid strokeDasharray="3 3" />

                          <XAxis dataKey="day" />

                          <YAxis />

                          <Tooltip />

                          <Bar
                            dataKey="deployments"
                            fill="#F51B63"
                            radius={[6, 6, 0, 0]}
                            barSize={22}
                          />
                        </BarChart>
                      </ResponsiveContainer>

                      <Box
                        sx={{
                          mt: 1,
                          borderTop: '1px solid #E5E7EB',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          py: 1.5,
                          gap: 2,
                        }}
                      >
                        <Typography color="text.secondary">
                          Last Deployment
                        </Typography>
                        <Typography fontWeight={700} textAlign="right">
                          {formatDeploymentTime(
                            metrics.deploymentInsights.lastDeployment,
                          )}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* GitHub Activity */}
                <Grid
                  item
                  xs={12}
                  lg={6}
                  sx={{ px: { xs: 1, md: 1.25 }, py: 0.5 }}
                >
                  <Card
                    elevation={1}
                    sx={{
                      borderRadius: 3,
                      border: '1px solid rgba(15, 23, 42, 0.08)',
                      boxShadow: '0 6px 18px rgba(15,23,42,.05)',
                      background: '#FFFFFF',
                      height: '100%',
                      minHeight: 520,
                    }}
                  >
                    <CardContent
                      sx={{
                        p: { xs: 2, md: 2.25 },
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: '#1B2B4A',
                          mb: 1.5,
                          position: 'relative',
                          pl: 1.25,
                          '&:before': {
                            content: '""',
                            position: 'absolute',
                            left: 0,
                            top: 2,
                            width: 4,
                            height: 20,
                            borderRadius: 2,
                            backgroundColor: '#005DFF',
                          },
                        }}
                        fontWeight={700}
                        gutterBottom
                      >
                        GitHub Activity - Last 30 Days
                      </Typography>

                      <ResponsiveContainer width="100%" height={420}>
                        <BarChart
                          data={metrics.githubTrend}
                          barCategoryGap="25%"
                        >
                          <CartesianGrid strokeDasharray="3 3" />

                          <XAxis dataKey="metric" />

                          <YAxis />

                          <Tooltip />

                          <Bar
                            dataKey="value"
                            fill="#005DFF"
                            radius={[6, 6, 0, 0]}
                            barSize={45}
                          />
                        </BarChart>
                      </ResponsiveContainer>

                      <Box
                        sx={{
                          mt: 1,
                          borderTop: '1px solid #E5E7EB',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          py: 1.5,
                          gap: 2,
                        }}
                      >
                        <Typography color="text.secondary">
                          Last PR Raised
                        </Typography>
                        <Typography fontWeight={700} textAlign="right">
                          {formatDeploymentTime(metrics.github.lastPullRequest)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </>
          )}
        </Stack>
      </Card>
    </Box>
  );
};
