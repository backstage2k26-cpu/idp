import React, { useMemo } from 'react';
import { Box, Button, Chip, Paper, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import RefreshIcon from '@material-ui/icons/Refresh';
import CloudQueueIcon from '@material-ui/icons/CloudQueue';
import LayersIcon from '@material-ui/icons/Layers';
import AppsIcon from '@material-ui/icons/Apps';
import { EmptyState, ResponseErrorPanel } from '@backstage/core-components';
import { useEntity } from '@backstage/plugin-catalog-react';
import { useLazyInfrastructureResources } from '../hooks/useLazyInfrastructureResources';
import {
  EnvironmentAccordion,
  ResourceFilters,
  useResourceFilters,
} from './EnvironmentAccordion';
import { hasInfrastructureResources } from '../utils/infrastructureSpec';
import { GCP_COLORS } from '../theme/gcpTheme';
import { PORTAL_HEADER } from '../theme/portalHeader';

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(2.5),
    width: '100%',
    maxWidth: 'none',
    [theme.breakpoints.up('md')]: {
      padding: theme.spacing(3),
    },
  },
  hero: {
    background: PORTAL_HEADER.gradient,
    borderRadius: theme.spacing(1.5),
    padding: theme.spacing(2.5),
    marginBottom: theme.spacing(3),
    color: PORTAL_HEADER.textPrimary,
    boxShadow: PORTAL_HEADER.shadow,
    position: 'relative',
    overflow: 'hidden',
    minHeight: PORTAL_HEADER.minHeight,
    display: 'flex',
    alignItems: 'center',
    borderLeft: `4px solid ${PORTAL_HEADER.accentGcp}`,
    borderBottom: '1px solid #E2E8F0',
    [theme.breakpoints.up('md')]: {
      padding: theme.spacing(3, 3.5),
    },
    [theme.breakpoints.down('sm')]: {
      minHeight: 'auto',
    },
    '&:before': {
      content: '""',
      position: 'absolute',
      top: -40,
      right: -40,
      width: 160,
      height: 160,
      borderRadius: '50%',
      background: 'rgba(156, 24, 47, 0.06)',
    },
  },
  heroContent: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: theme.spacing(2),
    width: '100%',
    [theme.breakpoints.down('sm')]: {
      alignItems: 'flex-start',
    },
  },
  titleBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    minWidth: 0,
    [theme.breakpoints.down('sm')]: {
      alignItems: 'flex-start',
    },
  },
  heroIcon: {
    backgroundColor: '#ffffff',
    borderRadius: theme.spacing(1.5),
    padding: theme.spacing(1),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 52,
    height: 52,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
    color: GCP_COLORS.blue,
  },
  heroTitle: {
    fontWeight: 700,
    letterSpacing: '-0.01em',
    fontSize: PORTAL_HEADER.titleFontSize,
    lineHeight: 1.2,
    [theme.breakpoints.down('sm')]: {
      wordBreak: 'break-word',
    },
  },
  heroSubtitle: {
    color: PORTAL_HEADER.textSecondary,
    marginTop: theme.spacing(0.5),
  },
  appChip: {
    backgroundColor: 'rgba(28, 53, 94, 0.08)',
    color: PORTAL_HEADER.textPrimary,
    fontWeight: 500,
    marginTop: theme.spacing(1),
    border: '1px solid rgba(28, 53, 94, 0.15)',
  },
  refreshButton: {
    backgroundColor: '#ffffff',
    color: PORTAL_HEADER.textPrimary,
    fontWeight: 600,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
    '&:hover': {
      backgroundColor: '#E8EEF5',
    },
    [theme.breakpoints.down('sm')]: {
      width: '100%',
      justifyContent: 'center',
    },
  },
  statsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(3),
  },
  statCard: {
    flex: '1 1 180px',
    padding: theme.spacing(2),
    borderRadius: theme.spacing(1.5),
    border: `1px solid ${GCP_COLORS.border}`,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    backgroundColor: theme.palette.background.paper,
    boxShadow: '0 1px 2px rgba(60, 64, 67, 0.08)',
  },
  statIconBlue: {
    backgroundColor: GCP_COLORS.blueLight,
    color: GCP_COLORS.blueDark,
    borderRadius: theme.spacing(1),
    padding: theme.spacing(1),
    display: 'flex',
  },
  statIconGreen: {
    backgroundColor: 'rgba(52, 168, 83, 0.12)',
    color: GCP_COLORS.green,
    borderRadius: theme.spacing(1),
    padding: theme.spacing(1),
    display: 'flex',
  },
  statValue: {
    fontWeight: 700,
    fontSize: '1.5rem',
    lineHeight: 1.1,
    color:
      theme.palette.type === 'dark'
        ? theme.palette.text.primary
        : GCP_COLORS.textPrimary,
  },
  statLabel: {
    color: GCP_COLORS.textSecondary,
    fontSize: '0.8125rem',
  },
  environmentsSection: {
    marginTop: theme.spacing(1),
  },
  sectionTitle: {
    fontWeight: 600,
    marginBottom: theme.spacing(2),
    color:
      theme.palette.type === 'dark'
        ? theme.palette.text.primary
        : GCP_COLORS.textPrimary,
  },
}));

export const InfrastructureResourcesTab = () => {
  const classes = useStyles();
  const { entity } = useEntity();
  const {
    applicationName,
    environments,
    loadedEnvironments,
    loading,
    refreshing,
    error,
    refresh,
    retry,
  } = useLazyInfrastructureResources();
  const {
    typeFilter,
    setTypeFilter,
    searchQuery,
    setSearchQuery,
    resourceTypes,
  } = useResourceFilters(loadedEnvironments);

  const stats = useMemo(() => {
    const totalResources = loadedEnvironments.reduce(
      (count, environment) => count + environment.resources.length,
      0,
    );
    return {
      environmentCount: environments.length,
      totalResources,
    };
  }, [environments.length, loadedEnvironments]);

  if (!hasInfrastructureResources(entity)) {
    return (
      <EmptyState
        title="Infrastructure configuration missing"
        missing="info"
        description="Add spec.infrastructure.environments or the company.com/infrastructure annotation to this Component to enable GCP resource discovery."
      />
    );
  }

  return (
    <Box className={classes.root}>
      <Paper className={classes.hero} elevation={0}>
        <Box className={classes.heroContent}>
          <Box className={classes.titleBlock}>
            <Box className={classes.heroIcon}>
              <CloudQueueIcon style={{ fontSize: 32 }} />
            </Box>
            <Box>
              <Typography component="h1" className={classes.heroTitle}>
                GCP Resources
              </Typography>
              <Typography variant="body2" className={classes.heroSubtitle}>
                Google Cloud resources discovered by application labels
              </Typography>
              <Chip
                icon={<AppsIcon style={{ color: PORTAL_HEADER.textPrimary }} />}
                label={applicationName}
                title={applicationName}
                size="small"
                className={classes.appChip}
              />
            </Box>
          </Box>
          <Button
            variant="contained"
            className={classes.refreshButton}
            startIcon={<RefreshIcon />}
            onClick={refresh}
            disabled={refreshing}
          >
            Refresh
          </Button>
        </Box>
      </Paper>

      <Box className={classes.statsRow}>
        <Paper className={classes.statCard} elevation={0}>
          <Box className={classes.statIconBlue}>
            <LayersIcon />
          </Box>
          <Box>
            <Typography className={classes.statValue}>
              {stats.environmentCount}
            </Typography>
            <Typography className={classes.statLabel}>
              Environment{stats.environmentCount === 1 ? '' : 's'}
            </Typography>
          </Box>
        </Paper>
        <Paper className={classes.statCard} elevation={0}>
          <Box className={classes.statIconGreen}>
            <CloudQueueIcon />
          </Box>
          <Box>
            <Typography className={classes.statValue}>
              {loading && loadedEnvironments.length === 0
                ? '…'
                : stats.totalResources}
            </Typography>
            <Typography className={classes.statLabel}>
              GCP Resource{stats.totalResources === 1 ? '' : 's'}
            </Typography>
          </Box>
        </Paper>
      </Box>

      {error && loadedEnvironments.length === 0 && (
        <Box marginBottom={2}>
          <ResponseErrorPanel
            error={error}
            title="Failed to load GCP resources"
          />
        </Box>
      )}

      <ResourceFilters
        resourceTypes={resourceTypes}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
      />

      {environments.length === 0 ? (
        <EmptyState
          title="No environments configured"
          missing="data"
          description="Add environment and project mappings to this Component to discover GCP resources."
        />
      ) : (
        <Box className={classes.environmentsSection}>
          <Typography variant="h6" className={classes.sectionTitle}>
            Environments
          </Typography>
          {environments.map((environment, index) => {
            const environmentData = environment.state.data ?? {
              name: environment.name,
              project: environment.project,
              resources: [],
              error: environment.state.error?.message,
            };

            return (
              <EnvironmentAccordion
                key={environment.name}
                environment={environmentData}
                loading={environment.state.loading && !environment.state.data}
                defaultExpanded={index === 0}
                typeFilter={typeFilter}
                searchQuery={searchQuery}
              />
            );
          })}
        </Box>
      )}

      {error && loadedEnvironments.length > 0 && (
        <Box marginTop={2}>
          <Button
            variant="contained"
            style={{ backgroundColor: GCP_COLORS.blue, color: '#ffffff' }}
            onClick={retry}
          >
            Retry failed environments
          </Button>
        </Box>
      )}
    </Box>
  );
};
