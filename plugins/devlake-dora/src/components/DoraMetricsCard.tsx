import React, { useEffect, useState } from 'react';
import { InfoCard, Progress } from '@backstage/core-components';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import { DoraMetrics, getDoraMetrics } from '../api';
import { useEntity } from '@backstage/plugin-catalog-react';

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

type Props = {
  project: string;
};

type MetricCardProps = {
  title: string;
  value: string | number;
  color: string;
};

const MetricCard = ({
  title,
  value,
  color,
}: MetricCardProps) => (
  <Card
    elevation={0}
    sx={{
      height: '100%',
      backgroundColor: '#fff',
      border: '1px solid #e5e7eb',
      borderLeft: `4px solid ${color}`, // color prop becomes the accent
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      transition: 'all 0.2s ease',
      '&:hover': {
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      },
    }}
  >
    <CardContent
      sx={{
        p: 2.2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <Typography
        sx={{
          fontSize: 14,
          fontWeight: 600,
          opacity: 0.95,
        }}
      >
        {title}
      </Typography>

      <Typography
        variant="h4"
        fontWeight={700}
      >
        {value}
      </Typography>
    </CardContent>
  </Card>
);

type SectionProps = {
  title: string;
  children: React.ReactNode;
};

const Section = ({
  title,
  children,
}: SectionProps) => (
  <Card
    elevation={1}
    sx={{
      borderRadius: 3,
      height: '100%',
    }}
  >
    <CardContent sx={{ p: 2.5 }}>

      <Typography
        variant="h6"
        fontWeight={700}
      >
        {title}
      </Typography>

      <Divider sx={{ my: 2 }} />

      {children}

    </CardContent>
  </Card>
);

export const DoraMetricsCard = ({
  project,
}: Props) => {
  const { entity } = useEntity();

  const environments = React.useMemo(
    () => getDoraEnvironments(entity),
    [entity],
  );

  const [tab, setTab] = React.useState(0);

  const selectedEnvironment =
    environments[tab] ?? environments[0];
  const [metrics, setMetrics] =
    useState<DoraMetrics>();

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string>();
  const hasDeploymentMetrics =
    (metrics?.dora.deploymentFrequency ?? 0) > 0;

  useEffect(() => {
    setLoading(true);

    getDoraMetrics(
      project,
      selectedEnvironment?.application,
    )
      .then(setMetrics)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [project, selectedEnvironment]);

  if (loading) {
    return <Progress />;
  }

  if (error) {
    return (
      <InfoCard title="🚀 DORA Metrics">
        <Typography color="error">
          {error}
        </Typography>
      </InfoCard>
    );
  }

  if (!metrics) {
    return (
      <InfoCard title="🚀 DORA Metrics">
        <Typography>
          No metrics available.
        </Typography>
      </InfoCard>
    );
  }

  return (
    <InfoCard title="🚀 DORA Metrics">
      <Stack spacing={2}>
        {/* Environment Tabs */}

          {environments.length > 0 && (
            <Box>
              <Tabs
                value={tab}
                onChange={(_, value) => setTab(value)}
                sx={{
                  mb: 2,
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#EF7B4D',
                    height: 3,
                  },
                }}
              >
                {environments.map(env => (
                  <Tab
                    key={env.key}
                    label={env.label}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      minWidth: 90,
                      '&.Mui-selected': {
                        color: '#E96533',
                      },
                    }}
                  />
                ))}
              </Tabs>
            </Box>
          )}

                  {/* ================= Repository ================= */}

          <Card
            elevation={1}
            sx={{
              borderRadius: 3,
            }}
          >
            <CardContent sx={{ py: 2 }}>
              <Grid
                container
                spacing={1}
                alignItems="center"
              >
                <Grid item xs={12} md={4}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    GitHub Repository
                  </Typography>

                  <Typography
                    fontWeight={700}
                    mt={0.5}
                  >
                    {metrics.repository.githubRepo}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    ArgoCD Application
                  </Typography>

                  <Typography
                    fontWeight={700}
                    mt={0.5}
                  >
                    {hasDeploymentMetrics
                      ? metrics.repository.argoApplication
                      : 'Not onboarded'}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Environment
                  </Typography>

                  <Box mt={0.5}>
                    <Chip
                      label={selectedEnvironment?.label ?? 'Unknown'}
                      color={
                        selectedEnvironment?.key === 'prod'
                          ? 'error'
                          : selectedEnvironment?.key === 'qa'
                          ? 'warning'
                          : 'success'
                      }
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
                variant="h4"
                sx={{ mb: 3 }}
              >
                Deployment Metrics
              </Typography>

              <Grid container spacing={1}>
              <Grid item xs={12} sm={6} lg={3} sx={{ p: 1 }}>
                <MetricCard
                  title="Deployments"
                  value={metrics.dora.deploymentFrequency}
                  color="#2196F3"
                />
              </Grid>

              <Grid item xs={12} sm={6} lg={3} sx={{ p: 1 }}>
                <MetricCard
                  title="Lead Time"
                  value={formatLeadTime(metrics.dora.leadTime)}
                  color="#7E57C2"
                />
              </Grid>

              <Grid item xs={12} sm={6} lg={3} sx={{ p: 1 }}>
                <MetricCard
                  title="MTTR"
                  value={metrics.dora.mttr ?? "No Failures"}
                  color="#26A69A"
                />
              </Grid>

              <Grid item xs={12} sm={6} lg={3} sx={{ p: 1 }}>
                <MetricCard
                  title="Failure Rate"
                  value={metrics.dora.changeFailureRate ?? "0%"}
                  color="#EF5350"
                />
              </Grid>
            </Grid>

          </Box>
          

        )}
        {!hasDeploymentMetrics && (
          <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
            No Argocd metrics are available for this environment because this application has not been onboarded to ArgoCD/DevLake yet.
          </Alert>
        )}

        {/* ================= Bottom Panels ================= */}

        <Grid container spacing={2}>

          {/* GitHub */}

          <Grid item xs={12} lg={6}>

            <Section title="🐙 GitHub Metrics">

              <Stack spacing={2}>

                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography color="text.secondary">
                    Open Pull Requests
                  </Typography>

                  <Typography fontWeight={700}>
                    {metrics.github.openPullRequests ?? 'N/A'}
                  </Typography>
                </Box>

                <Divider />

                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography color="text.secondary">
                    Merged Pull Requests
                  </Typography>

                  <Typography fontWeight={700}>
                    {metrics.github.mergedPullRequests ?? 'N/A'}
                  </Typography>
                </Box>

                <Divider />

                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography color="text.secondary">
                    Commits (Last 30 Days)
                  </Typography>

                  <Typography fontWeight={700}>
                    {metrics.github.commitsLast30Days ?? 'N/A'}
                  </Typography>
                </Box>

                <Divider />

                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography color="text.secondary">
                    Active Contributors
                  </Typography>

                  <Typography fontWeight={700}>
                    {metrics.github.activeContributors}
                  </Typography>
                </Box>

              </Stack>

            </Section>

          </Grid>
          

          {/* ArgoCD */}

            {hasDeploymentMetrics && (

            <Grid item xs={12} lg={6}>

            <Section title="🚀 ArgoCD Metrics">

              <Stack spacing={2}>

                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography color="text.secondary">
                    Deployments Today
                  </Typography>

                  <Typography fontWeight={700}>
                    {metrics.deploymentInsights.deploymentsToday}
                  </Typography>
                </Box>

                <Divider />

                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography color="text.secondary">
                    Deployments This Week
                  </Typography>

                  <Typography fontWeight={700}>
                    {metrics.deploymentInsights.deploymentsThisWeek}
                  </Typography>
                </Box>

                <Divider />

                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography color="text.secondary">
                    Last Deployment
                  </Typography>

                  <Typography fontWeight={700}>
                    {metrics.deploymentInsights.lastDeployment ?? 'N/A'}
                  </Typography>
                </Box>

                <Divider />

                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography color="text.secondary">
                    Rollback Count
                  </Typography>

                  <Typography fontWeight={700}>
                    {metrics.deploymentInsights.rollbackCount}
                  </Typography>
                </Box>

              </Stack>

            </Section>

          </Grid>
        )}    
        </Grid>
        

      </Stack>

    </InfoCard>

  );
};