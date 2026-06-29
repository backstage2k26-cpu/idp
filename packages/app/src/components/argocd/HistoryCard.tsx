import React from 'react';
import {
  Paper,
  Typography,
  makeStyles,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
} from '@material-ui/core';
import { useApi } from '@backstage/core-plugin-api';
import { argoCDApiRef } from '@roadiehq/backstage-plugin-argo-cd';

const useStyles = makeStyles(theme => ({
  paper: { padding: theme.spacing(2), height: '100%' },
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
    <Paper className={classes.paper}>
      <Typography variant="h6" gutterBottom>
        ArgoCD history
      </Typography>
      {loading ? (
        <CircularProgress size={24} />
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Revision</TableCell>
              <TableCell>Deployed By</TableCell>
              <TableCell>Started</TableCell>
              <TableCell>Finished</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(row => (
              <TableRow key={`${row.revision}-${row.started}`}>
                <TableCell>{row.revision}</TableCell>
                <TableCell>{row.deployedBy}</TableCell>
                <TableCell>{row.started}</TableCell>
                <TableCell>{row.finished}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Paper>
  );
};
