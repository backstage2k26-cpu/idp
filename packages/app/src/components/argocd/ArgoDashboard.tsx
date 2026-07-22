import React from 'react';
import {
  Box,
  Chip,
  Grid,
  Paper,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  makeStyles,
  withStyles,
} from '@material-ui/core';
import { useEntity } from '@backstage/plugin-catalog-react';
import { Entity } from '@backstage/catalog-model';
import { useApi } from '@backstage/core-plugin-api';
import FavoriteIcon from '@material-ui/icons/Favorite';
import SyncIcon from '@material-ui/icons/Sync';
import DnsIcon from '@material-ui/icons/Dns';
import StorageIcon from '@material-ui/icons/Storage';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import {
  ARGOCD_ANNOTATION_APP_NAME,
  ARGOCD_ANNOTATION_APP_NAMESPACE,
  ARGOCD_ANNOTATION_PROJECT_NAME,
  argoCDApiRef,
} from '@roadiehq/backstage-plugin-argo-cd';
import { HistoryCard } from './HistoryCard';
import { StatusChip } from './StatusChip';
import {
  ARGO_COLORS,
  getArgoEnvironmentColor,
  getArgoStatusTone,
} from './argoTheme';
import { TabPageHeader } from '../common/TabPageHeader';

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(2.5),
    width: '100%',
    maxWidth: 'none',
    [theme.breakpoints.up('md')]: {
      padding: theme.spacing(3),
    },
  },
  metaChip: {
    backgroundColor: 'rgba(28, 53, 94, 0.08)',
    color: '#1C355E',
    border: '1px solid rgba(28, 53, 94, 0.15)',
    marginTop: theme.spacing(1),
    marginRight: theme.spacing(0.75),
  },
  tabsWrap: {
    marginBottom: theme.spacing(3),
    borderBottom: `1px solid ${ARGO_COLORS.border}`,
    overflowX: 'auto',
  },
  metricCard: {
    padding: theme.spacing(2),
    height: '100%',
    borderRadius: theme.spacing(1.5),
    border: `1px solid ${ARGO_COLORS.border}`,
    boxShadow: '0 1px 3px rgba(33, 55, 67, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  },
  metricHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricIconWrap: {
    width: 36,
    height: 36,
    borderRadius: theme.spacing(1),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    color: ARGO_COLORS.textSecondary,
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    fontWeight: 700,
    letterSpacing: '0.04em',
  },
  metricDetail: {
    color: theme.palette.text.secondary,
    fontSize: '0.8125rem',
  },
  sectionCard: {
    padding: theme.spacing(2.5),
    height: '100%',
    borderRadius: theme.spacing(1.5),
    border: `1px solid ${ARGO_COLORS.border}`,
    boxShadow: '0 1px 3px rgba(33, 55, 67, 0.08)',
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(2),
    fontWeight: 700,
    color:
      theme.palette.type === 'dark'
        ? theme.palette.text.primary
        : ARGO_COLORS.navy,
  },
  sectionAccent: {
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: ARGO_COLORS.orange,
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: '140px 1fr',
    gap: theme.spacing(1.5, 2),
    alignItems: 'start',
    [theme.breakpoints.down('sm')]: {
      gridTemplateColumns: '1fr',
      gap: theme.spacing(0.75),
    },
  },
  detailLabel: {
    color: ARGO_COLORS.textSecondary,
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    fontWeight: 700,
    letterSpacing: '0.03em',
  },
  detailValue: {
    wordBreak: 'break-word',
    fontSize: '0.9375rem',
    minWidth: 0,
  },
  tableContainer: {
    borderRadius: theme.spacing(1),
    border: `1px solid ${ARGO_COLORS.border}`,
    overflow: 'auto',
    width: '100%',
  },
  tableHeader: {
    fontWeight: 600,
    fontSize: '0.75rem',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: '#ffffff',
    backgroundColor: ARGO_COLORS.orangeDark,
    borderBottom: 'none',
    whiteSpace: 'nowrap',
  },
  tableRow: {
    '&:nth-of-type(even)': {
      backgroundColor:
        theme.palette.type === 'dark'
          ? 'rgba(255, 255, 255, 0.02)'
          : 'rgba(239, 123, 77, 0.04)',
    },
  },
  imageValue: {
    fontFamily: 'Roboto Mono, monospace',
    fontSize: '0.875rem',
    wordBreak: 'break-all',
    color:
      theme.palette.type === 'dark'
        ? theme.palette.text.primary
        : ARGO_COLORS.navy,
  },
  externalLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    color: '#4A69BD',
    textDecoration: 'none',
    fontWeight: 500,
    fontSize: '0.8125rem',
    '&:hover': {
      textDecoration: 'underline',
    },
    [theme.breakpoints.down('sm')]: {
      maxWidth: '100%',
      wordBreak: 'break-word',
    },
  },
}));

const ArgoTabs = withStyles({
  indicator: {
    backgroundColor: ARGO_COLORS.orange,
    height: 3,
    borderRadius: '3px 3px 0 0',
  },
})(Tabs);

const ArgoTab = withStyles(theme => ({
  root: {
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '0.9375rem',
    minWidth: 88,
    '&$selected': {
      color: ARGO_COLORS.orangeDark,
    },
  },
  selected: {},
}))(Tab);

type ArgoDetails = {
  metadata: {
    name: string;
    namespace: string;
    instance?: { name?: string; url?: string };
  };
  status?: {
    sync?: { status?: string };
    health?: { status?: string };
    operationState?: {
      operation?: {
        initiatedBy?: { username?: string };
      };
      startedAt?: string;
      finishedAt?: string;
    };
    history?: Array<{
      revision?: string;
      deployStartedAt?: string;
      deployedAt?: string;
      deployedBy?: { username?: string };
    }>;
    resources?: Array<{
      kind?: string;
      name?: string;
      namespace?: string;
      status?: string;
      health?: { status?: string };
      age?: string;
      images?: string[];
    }>;
    summary?: {
      images?: string[];
    };
  };
  spec?: {
    source?: {
      repoURL?: string;
      path?: string;
      targetRevision?: string;
    };
    sources?: Array<{
      repoURL?: string;
      path?: string;
      targetRevision?: string;
      ref?: string;
    }>;
    destination?: {
      server?: string;
      namespace?: string;
    };
    syncPolicy?: {
      automated?: Record<string, unknown>;
    };
    project?: string;
  };
};

type ArgoEnvironment = {
  key: 'dev' | 'qa' | 'prod';
  label: string;
  appName: string;
};

const getAnnotation = (entity: Entity, annotation: string) =>
  entity.metadata.annotations?.[annotation] ?? '';

const getEnvironments = (entity: Entity): ArgoEnvironment[] => {
  const envs: ArgoEnvironment[] = ['dev', 'qa', 'prod']
    .map(key => {
      const appName =
        getAnnotation(entity, `platform.io/argocd-${key}`) ||
        getAnnotation(entity, ARGOCD_ANNOTATION_APP_NAME);
      return appName
        ? {
            key: key as ArgoEnvironment['key'],
            label: key.toUpperCase(),
            appName,
          }
        : null;
    })
    .filter((value): value is ArgoEnvironment => Boolean(value));

  return envs;
};

const hasAnyArgoEnvironment = (entity: Entity) =>
  Boolean(
    entity.metadata.annotations?.['platform.io/argocd-dev'] ||
      entity.metadata.annotations?.['platform.io/argocd-qa'] ||
      entity.metadata.annotations?.['platform.io/argocd-prod'] ||
      entity.metadata.annotations?.['argocd/app-name'],
  );

const getMetricIconStyle = (tone: string) => {
  const resolved = getArgoStatusTone(tone);
  if (resolved === 'healthy' || resolved === 'synced') {
    return { background: ARGO_COLORS.healthyBg, color: ARGO_COLORS.healthy };
  }
  if (resolved === 'degraded') {
    return { background: ARGO_COLORS.degradedBg, color: ARGO_COLORS.degraded };
  }
  if (resolved === 'outOfSync') {
    return { background: ARGO_COLORS.outOfSyncBg, color: '#B8860B' };
  }
  if (resolved === 'progressing') {
    return {
      background: ARGO_COLORS.progressingBg,
      color: ARGO_COLORS.progressing,
    };
  }
  return { background: ARGO_COLORS.orangeLight, color: ARGO_COLORS.orangeDark };
};

export const ArgoDashboard = () => {
  const classes = useStyles();
  const { entity } = useEntity();
  const argoApi = useApi(argoCDApiRef);
  const environments = React.useMemo(() => getEnvironments(entity), [entity]);
  const [tab, setTab] = React.useState(0);
  const [details, setDetails] = React.useState<ArgoDetails | null>(null);

  if (!hasAnyArgoEnvironment(entity)) {
    return null;
  }

  const selectedEnvironment = environments[tab] ?? environments[0];
  const appName =
    selectedEnvironment?.appName ||
    getAnnotation(entity, ARGOCD_ANNOTATION_APP_NAME) ||
    entity.metadata.name;
  const appNamespace =
    getAnnotation(entity, ARGOCD_ANNOTATION_APP_NAMESPACE) ||
    entity.metadata.namespace ||
    'default';

  const projectName = getAnnotation(entity, ARGOCD_ANNOTATION_PROJECT_NAME);

  React.useEffect(() => {
    let active = true;

    setDetails(null);

    const loadApplication = async () => {
      try {
        const services = await argoApi.serviceLocatorUrl({
          appName,
          appNamespace,
        });

        if (!active) {
          return;
        }

        if (!Array.isArray(services) || services.length === 0) {
          setDetails(null);
          return;
        }

        const service = services[0];

        const result = await argoApi.getAppDetails({
          url: service.url,
          appName,
          appNamespace,
          instance: service.name,
        });

        if (!active) {
          return;
        }

        setDetails(result as ArgoDetails);
      } catch (e) {
        console.error(`Unable to load ${appName}`, e);

        if (active) {
          setDetails(null);
        }
      }
    };

    loadApplication();

    return () => {
      active = false;
    };
  }, [argoApi, appName, appNamespace]);

  const syncStatus = details?.status?.sync?.status ?? 'Unknown';
  const healthStatus = details?.status?.health?.status ?? 'Unknown';
  const primarySource =
    details?.spec?.sources?.find(s => !s.ref) ??
    details?.spec?.sources?.[0] ??
    details?.spec?.source;

  const repo = primarySource?.repoURL ?? '-';
  const path = primarySource?.path ?? '-';
  const targetRevision = primarySource?.targetRevision ?? '-';
  const resources = details?.status?.resources ?? [];
  const image = details?.status?.summary?.images?.[0] ?? '-';
  const recentHistory = details?.status?.history ?? [];
  const deployedBy =
    details?.status?.operationState?.operation?.initiatedBy?.username ??
    recentHistory[0]?.deployedBy?.username ??
    'Auto Sync';
  const lastSync =
    details?.status?.operationState?.finishedAt ??
    details?.status?.operationState?.startedAt ??
    '-';
  const cluster =
    details?.spec?.destination?.server === 'https://kubernetes.default.svc'
      ? 'local'
      : details?.spec?.destination?.server ?? 'Unknown';
  const argoUrl = details?.metadata.instance?.url;
  const envColor = selectedEnvironment
    ? getArgoEnvironmentColor(selectedEnvironment.key)
    : ARGO_COLORS.orange;

  return (
    <Box className={classes.root}>
      <TabPageHeader
        title={appName}
        subtitle="GitOps continuous delivery powered by Argo CD"
        iconSrc="/argocd.svg"
        iconAlt="Argo CD"
        accent="argo"
        chips={
          <>
            <Chip
              size="small"
              label={`argocd/${appName}`}
              className={classes.metaChip}
            />
            {projectName ? (
              <Chip
                size="small"
                label={`Project ${projectName}`}
                className={classes.metaChip}
              />
            ) : null}
            {argoUrl ? (
              <a
                href={argoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={classes.externalLink}
              >
                Open in Argo CD
                <OpenInNewIcon style={{ fontSize: 16 }} />
              </a>
            ) : null}
          </>
        }
        trailing={
          selectedEnvironment ? (
            <Chip
              label={selectedEnvironment.label}
              style={{
                backgroundColor: envColor,
                color: '#ffffff',
                fontWeight: 700,
                letterSpacing: '0.06em',
              }}
            />
          ) : undefined
        }
      />

      <Box className={classes.tabsWrap}>
        <ArgoTabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          textColor="primary"
        >
          {environments.map(env => (
            <ArgoTab key={env.key} label={env.label} />
          ))}
        </ArgoTabs>
      </Box>

      {details ? (
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Paper
              className={classes.metricCard}
              elevation={0}
              style={{ borderLeft: `4px solid ${ARGO_COLORS.healthy}` }}
            >
              <Box className={classes.metricHeader}>
                <Typography className={classes.metricLabel}>Health</Typography>
                <Box
                  className={classes.metricIconWrap}
                  style={getMetricIconStyle(healthStatus)}
                >
                  <FavoriteIcon fontSize="small" />
                </Box>
              </Box>
              <StatusChip label={healthStatus} />
              <Typography className={classes.metricDetail}>
                Application health status
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper
              className={classes.metricCard}
              elevation={0}
              style={{ borderLeft: `4px solid ${ARGO_COLORS.orange}` }}
            >
              <Box className={classes.metricHeader}>
                <Typography className={classes.metricLabel}>
                  Sync Status
                </Typography>
                <Box
                  className={classes.metricIconWrap}
                  style={getMetricIconStyle(syncStatus)}
                >
                  <SyncIcon fontSize="small" />
                </Box>
              </Box>
              <StatusChip label={syncStatus} />
              <Typography className={classes.metricDetail}>
                Last sync {lastSync}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper
              className={classes.metricCard}
              elevation={0}
              style={{ borderLeft: `4px solid ${ARGO_COLORS.progressing}` }}
            >
              <Box className={classes.metricHeader}>
                <Typography className={classes.metricLabel}>
                  Namespace
                </Typography>
                <Box
                  className={classes.metricIconWrap}
                  style={{
                    background: ARGO_COLORS.progressingBg,
                    color: ARGO_COLORS.progressing,
                  }}
                >
                  <DnsIcon fontSize="small" />
                </Box>
              </Box>
              <Typography variant="h6" style={{ fontWeight: 700 }}>
                {appNamespace}
              </Typography>
              <Typography className={classes.metricDetail}>
                Target namespace · Cluster {cluster}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper className={classes.sectionCard} elevation={0}>
              <Typography className={classes.sectionTitle}>
                <span className={classes.sectionAccent} />
                Deployment Info
              </Typography>
              <Box className={classes.detailGrid}>
                <Typography className={classes.detailLabel}>
                  Application
                </Typography>
                <Typography className={classes.detailValue}>
                  {appName}
                </Typography>
                <Typography className={classes.detailLabel}>Project</Typography>
                <Typography className={classes.detailValue}>
                  {projectName || details?.spec?.project || '-'}
                </Typography>
                <Typography className={classes.detailLabel}>
                  Repository
                </Typography>
                <Typography className={classes.detailValue}>{repo}</Typography>
                <Typography className={classes.detailLabel}>Path</Typography>
                <Typography className={classes.detailValue}>{path}</Typography>
                <Typography className={classes.detailLabel}>
                  Target Revision
                </Typography>
                <Typography className={classes.detailValue}>
                  {targetRevision}
                </Typography>
                <Typography className={classes.detailLabel}>
                  Auto Sync
                </Typography>
                <Typography className={classes.detailValue}>
                  {details?.spec?.syncPolicy?.automated
                    ? 'Enabled'
                    : 'Disabled'}
                </Typography>
                <Typography className={classes.detailLabel}>
                  Sync Policy
                </Typography>
                <Typography className={classes.detailValue}>
                  {details?.spec?.syncPolicy?.automated
                    ? 'Prune, Self Heal'
                    : '-'}
                </Typography>
                <Typography className={classes.detailLabel}>Cluster</Typography>
                <Typography className={classes.detailValue}>
                  {cluster}
                </Typography>
                <Typography className={classes.detailLabel}>
                  Deployed By
                </Typography>
                <Typography className={classes.detailValue}>
                  {deployedBy}
                </Typography>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper className={classes.sectionCard} elevation={0}>
              <Typography className={classes.sectionTitle}>
                <span className={classes.sectionAccent} />
                Resources ({resources.length})
              </Typography>
              <Box className={classes.tableContainer}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell className={classes.tableHeader}>
                        Kind
                      </TableCell>
                      <TableCell className={classes.tableHeader}>
                        Name
                      </TableCell>
                      <TableCell className={classes.tableHeader}>
                        Status
                      </TableCell>
                      <TableCell className={classes.tableHeader}>
                        Health
                      </TableCell>
                      <TableCell className={classes.tableHeader}>Age</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {resources.map((resource, index) => (
                      <TableRow
                        key={`${resource.kind}-${resource.name}-${index}`}
                        className={classes.tableRow}
                      >
                        <TableCell>{resource.kind ?? '-'}</TableCell>
                        <TableCell>{resource.name ?? '-'}</TableCell>
                        <TableCell>
                          {resource.status ? (
                            <StatusChip label={resource.status} />
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {resource.health?.status ? (
                            <StatusChip label={resource.health.status} />
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>{resource.age ?? '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper className={classes.sectionCard} elevation={0}>
              <Typography className={classes.sectionTitle}>
                <span className={classes.sectionAccent} />
                Container Image
              </Typography>
              <Box display="flex" alignItems="flex-start" style={{ gap: 12 }}>
                <Box
                  className={classes.metricIconWrap}
                  style={{
                    background: ARGO_COLORS.orangeLight,
                    color: ARGO_COLORS.orangeDark,
                  }}
                >
                  <StorageIcon fontSize="small" />
                </Box>
                <Typography className={classes.imageValue}>{image}</Typography>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper className={classes.sectionCard} elevation={0}>
              <Typography className={classes.sectionTitle}>
                <span className={classes.sectionAccent} />
                Recent Sync History
              </Typography>
              <Box className={classes.tableContainer}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell className={classes.tableHeader}>
                        Revision
                      </TableCell>
                      <TableCell className={classes.tableHeader}>
                        Deployed By
                      </TableCell>
                      <TableCell className={classes.tableHeader}>
                        Time
                      </TableCell>
                      <TableCell className={classes.tableHeader}>
                        Status
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentHistory.slice(0, 3).map((entry, index) => (
                      <TableRow
                        key={`${entry.revision ?? 'rev'}-${index}`}
                        className={classes.tableRow}
                      >
                        <TableCell
                          style={{
                            fontFamily: 'Roboto Mono, monospace',
                            fontSize: '0.8125rem',
                          }}
                        >
                          {entry.revision ?? '-'}
                        </TableCell>
                        <TableCell>
                          {entry.deployedBy?.username ?? '-'}
                        </TableCell>
                        <TableCell>
                          {entry.deployedAt ?? entry.deployStartedAt ?? '-'}
                        </TableCell>
                        <TableCell>
                          <StatusChip label={syncStatus} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      ) : (
        <Paper
          className={classes.sectionCard}
          elevation={0}
          style={{
            padding: '60px 20px',
            textAlign: 'center',
          }}
        >
          <Typography variant="h5" gutterBottom>
            ArgoCD application not found
          </Typography>

          <Typography color="textSecondary">
            No application named <strong>{appName}</strong> exists.
          </Typography>

          <Typography
            variant="body2"
            color="textSecondary"
            style={{ marginTop: 16 }}
          >
            Select another environment from the tabs above.
          </Typography>
        </Paper>
      )}

      {details && (
        <HistoryCard
          appName={appName}
          appNamespace={appNamespace}
          instanceName={details.metadata.instance?.name}
        />
      )}
    </Box>
  );
};
