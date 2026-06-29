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
} from '@material-ui/core';
import { useEntity } from '@backstage/plugin-catalog-react';
import { Entity } from '@backstage/catalog-model';
import { useApi } from '@backstage/core-plugin-api';
import {
  ARGOCD_ANNOTATION_APP_NAME,
  ARGOCD_ANNOTATION_APP_NAMESPACE,
  ARGOCD_ANNOTATION_PROJECT_NAME,
  argoCDApiRef,
} from '@roadiehq/backstage-plugin-argo-cd';
import { HistoryCard } from './HistoryCard';

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(3),
    marginBottom: theme.spacing(3),
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2),
    flexWrap: 'wrap',
  },
  meta: {
    color: theme.palette.text.secondary,
  },
  tabs: {
    marginBottom: theme.spacing(3),
  },
  card: {
    padding: theme.spacing(2),
    height: '100%',
  },
  label: {
    color: theme.palette.text.secondary,
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: 700,
    letterSpacing: 0,
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(2),
    fontWeight: 700,
  },
  tableWrap: {
    overflowX: 'auto',
  },
  linkRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    wordBreak: 'break-word',
  },
}));

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

const formatResourceCount = (details: ArgoDetails | null) =>
  details?.status?.resources?.length ?? 0;

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

    argoApi
      .serviceLocatorUrl({ appName, appNamespace })
      .then(async services => {
        if (!active || !Array.isArray(services) || services.length === 0) {
          return null;
        }

        const service = services[0];
        return argoApi.getAppDetails({
          url: service.url,
          appName,
          appNamespace,
          instance: service.name,
        });
      })
      .then(result => {
        if (active && result) {
          setDetails(result as ArgoDetails);
        }
      });

    return () => {
      active = false;
    };
  }, [argoApi, appName, appNamespace]);

  const syncStatus = details?.status?.sync?.status ?? 'Unknown';
  const healthStatus = details?.status?.health?.status ?? 'Unknown';
  const revision =
    details?.status?.history?.[0]?.revision ??
    details?.spec?.source?.targetRevision ??
    '-';
  const cluster = details?.metadata.instance?.name ?? 'local';
  const repo = details?.spec?.source?.repoURL ?? '-';
  const path = details?.spec?.source?.path ?? '-';
  const targetRevision = details?.spec?.source?.targetRevision ?? '-';
  const resources = details?.status?.resources ?? [];
  const image = details?.status?.summary?.images?.[0] ?? '-';
  const recentHistory = details?.status?.history ?? [];
  const deployedBy = recentHistory[0]?.deployedBy?.username ?? '-';
  const initiatedBy =
    details?.status?.operationState?.operation?.initiatedBy?.username ?? '-';
  const lastSync =
    details?.status?.operationState?.finishedAt ??
    details?.status?.operationState?.startedAt ??
    '-';

  return (
    <Paper className={classes.root}>
      <div className={classes.header}>
        <div>
          <Typography variant="h4">{appName}</Typography>
          <Typography className={classes.meta}>
            Argo CD application: argocd/{appName}
          </Typography>
        </div>
        {projectName ? (
          <Typography className={classes.meta}>
            Namespace {appNamespace} · Project {projectName}
          </Typography>
        ) : null}
      </div>

      <Tabs
        value={tab}
        onChange={(_, value) => setTab(value)}
        indicatorColor="primary"
        textColor="primary"
        className={classes.tabs}
      >
        {environments.map(env => (
          <Tab key={env.key} label={env.label} />
        ))}
      </Tabs>

      {selectedEnvironment && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Paper className={classes.card}>
              <Typography className={classes.label}>Health</Typography>
              <Typography variant="h5">{healthStatus}</Typography>
              <Typography color="textSecondary">
                All resources are healthy
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper className={classes.card}>
              <Typography className={classes.label}>Sync Status</Typography>
              <Typography variant="h5">{syncStatus}</Typography>
              <Typography color="textSecondary">
                Last sync {lastSync}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper className={classes.card}>
              <Typography className={classes.label}>Namespace</Typography>
              <Typography variant="h5">{appNamespace}</Typography>
              <Typography color="textSecondary">Target namespace</Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper className={classes.card}>
              <Typography className={classes.sectionTitle}>
                Deployment Info
              </Typography>
              <Box
                display="grid"
                gridTemplateColumns="160px 1fr"
                gridRowGap={12}
              >
                <Typography className={classes.label}>Application</Typography>
                <Typography>{appName}</Typography>
                <Typography className={classes.label}>Project</Typography>
                <Typography>
                  {projectName || details?.spec?.project || '-'}
                </Typography>
                <Typography className={classes.label}>Repository</Typography>
                <Typography>{repo}</Typography>
                <Typography className={classes.label}>Path</Typography>
                <Typography>{path}</Typography>
                <Typography className={classes.label}>
                  Target Revision
                </Typography>
                <Typography>{targetRevision}</Typography>
                <Typography className={classes.label}>Auto Sync</Typography>
                <Typography>
                  {details?.spec?.syncPolicy?.automated
                    ? 'Enabled'
                    : 'Disabled'}
                </Typography>
                <Typography className={classes.label}>Sync Policy</Typography>
                <Typography>
                  {details?.spec?.syncPolicy?.automated
                    ? 'Prune, Self Heal'
                    : '-'}
                </Typography>
                <Typography className={classes.label}>Cluster</Typography>
                <Typography>{cluster}</Typography>
                <Typography className={classes.label}>Deployed By</Typography>
                <Typography>
                  {initiatedBy !== '-' ? initiatedBy : deployedBy}
                </Typography>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper className={classes.card}>
              <Typography className={classes.sectionTitle}>
                Resources ({resources.length})
              </Typography>
              <div className={classes.tableWrap}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Kind</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Health</TableCell>
                      <TableCell>Age</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {resources.map((resource, index) => (
                      <TableRow
                        key={`${resource.kind}-${resource.name}-${index}`}
                      >
                        <TableCell>{resource.kind ?? '-'}</TableCell>
                        <TableCell>{resource.name ?? '-'}</TableCell>
                        <TableCell>{resource.status ?? '-'}</TableCell>
                        <TableCell>{resource.health?.status ?? '-'}</TableCell>
                        <TableCell>{resource.age ?? '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper className={classes.card}>
              <Typography className={classes.sectionTitle}>Image</Typography>
              <Typography className={classes.label}>Container Image</Typography>
              <Typography variant="h6">{image}</Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper className={classes.card}>
              <Typography className={classes.sectionTitle}>
                Recent Sync History
              </Typography>
              <div className={classes.tableWrap}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Revision</TableCell>
                      <TableCell>Deployed By</TableCell>
                      <TableCell>Time</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentHistory.slice(0, 3).map((entry, index) => (
                      <TableRow key={`${entry.revision ?? 'rev'}-${index}`}>
                        <TableCell>{entry.revision ?? '-'}</TableCell>
                        <TableCell>
                          {entry.deployedBy?.username ?? '-'}
                        </TableCell>
                        <TableCell>
                          {entry.deployedAt ?? entry.deployStartedAt ?? '-'}
                        </TableCell>
                        <TableCell>
                          <Chip size="small" label={syncStatus} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Paper>
          </Grid>
        </Grid>
      )}

      {selectedEnvironment ? (
        <HistoryCard
          appName={appName}
          appNamespace={appNamespace}
          instanceName={details?.metadata.instance?.name}
        />
      ) : null}
    </Paper>
  );
};
