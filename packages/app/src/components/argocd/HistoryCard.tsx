import React from 'react';
import {
  Box,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  makeStyles,
} from '@material-ui/core';
import HistoryIcon from '@material-ui/icons/History';
import { useApi } from '@backstage/core-plugin-api';
import { argoCDApiRef } from '@roadiehq/backstage-plugin-argo-cd';
import { ARGO_COLORS } from './argoTheme';

const useStyles = makeStyles(theme => ({
  paper: {
    marginTop: theme.spacing(3),
    borderRadius: theme.spacing(1.5),
    border: `1px solid ${ARGO_COLORS.border}`,
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(33, 55, 67, 0.08)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(2),
    backgroundColor:
      theme.palette.type === 'dark'
        ? 'rgba(239, 123, 77, 0.1)'
        : ARGO_COLORS.orangeLight,
    borderBottom: `1px solid ${ARGO_COLORS.border}`,
  },
  headerTitle: {
    fontWeight: 600,
    color: theme.palette.type === 'dark' ? theme.palette.text.primary : ARGO_COLORS.navy,
  },
  content: {
    padding: theme.spacing(2),
  },
  tableContainer: {
    borderRadius: theme.spacing(1),
    border: `1px solid ${ARGO_COLORS.border}`,
    overflow: 'hidden',
  },
  tableHeader: {
    fontWeight: 600,
    fontSize: '0.75rem',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: '#ffffff',
    backgroundColor: ARGO_COLORS.orangeDark,
    borderBottom: 'none',
  },
  tableRow: {
    '&:nth-of-type(even)': {
      backgroundColor:
        theme.palette.type === 'dark'
          ? 'rgba(255, 255, 255, 0.02)'
          : 'rgba(239, 123, 77, 0.04)',
    },
  },
  revisionCell: {
    fontFamily: 'Roboto Mono, monospace',
    fontSize: '0.8125rem',
  },
  loadingWrap: {
    display: 'flex',
    justifyContent: 'center',
    padding: theme.spacing(3),
  },
}));

type HistoryRow = {
  revision: string;
  deployedBy: string;
  started: string;
  finished: string;
};

export const HistoryCard = ({
  appName,
  appNamespace,
  instanceName,
}: {
  appName: string;
  appNamespace: string;
  instanceName?: string;
}) => {
  const classes = useStyles();
  const argoApi = useApi(argoCDApiRef);
  const [rows, setRows] = React.useState<HistoryRow[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let active = true;

    setLoading(true);
    argoApi
      .serviceLocatorUrl({ appName, appNamespace })
      .then(async services => {
        if (!active || !Array.isArray(services) || services.length === 0) {
          return [];
        }

        const service = services[0];
        const details = await argoApi.getAppDetails({
          url: service.url,
          appName,
          appNamespace,
          instance: instanceName ?? service.name,
        });
        const history = details.status?.history ?? [];

        return Promise.all(
          history.map(async entry => {
            const revision =
              typeof entry.revision === 'string' ? entry.revision : undefined;
            const started = entry.deployStartedAt ?? '-';
            const finished = entry.deployedAt ?? '-';

            if (!revision) {
              return {
                revision: '-',
                deployedBy: '-',
                started,
                finished,
              };
            }

            const revisionDetails = await argoApi.getRevisionDetails({
              url: service.url,
              app: appName,
              appNamespace,
              instanceName: instanceName ?? service.name,
              revisionID: revision,
            });

            return {
              revision,
              deployedBy: revisionDetails.author ?? '-',
              started: revisionDetails.date ?? started,
              finished,
            };
          }),
        );
      })
      .then(result => {
        if (active && Array.isArray(result)) {
          setRows(result);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [argoApi, appName, appNamespace, instanceName]);

  return (
    <Paper className={classes.paper} elevation={0}>
      <Box className={classes.header}>
        <HistoryIcon style={{ color: ARGO_COLORS.orangeDark }} />
        <Typography variant="h6" className={classes.headerTitle}>
          Deployment History
        </Typography>
      </Box>
      <Box className={classes.content}>
        {loading ? (
          <Box className={classes.loadingWrap}>
            <CircularProgress
              size={28}
              style={{ color: ARGO_COLORS.orange }}
            />
          </Box>
        ) : rows.length === 0 ? (
          <Typography color="textSecondary">No deployment history available.</Typography>
        ) : (
          <Box className={classes.tableContainer}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell className={classes.tableHeader}>Revision</TableCell>
                  <TableCell className={classes.tableHeader}>Deployed By</TableCell>
                  <TableCell className={classes.tableHeader}>Started</TableCell>
                  <TableCell className={classes.tableHeader}>Finished</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map(row => (
                  <TableRow
                    key={`${row.revision}-${row.started}`}
                    className={classes.tableRow}
                  >
                    <TableCell className={classes.revisionCell}>
                      {row.revision}
                    </TableCell>
                    <TableCell>{row.deployedBy}</TableCell>
                    <TableCell>{row.started}</TableCell>
                    <TableCell>{row.finished}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Box>
    </Paper>
  );
};
