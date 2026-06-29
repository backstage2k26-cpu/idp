import React from 'react';
import {
  Paper,
  Typography,
  makeStyles,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@material-ui/core';
import { ArgoCdResource } from './types';

const useStyles = makeStyles(theme => ({
  paper: { padding: theme.spacing(2), height: '100%' },
  cell: { fontWeight: 600 },
}));

export const ResourcesCard = ({
  resources,
}: {
  resources: ArgoCdResource[];
}) => {
  const classes = useStyles();

  return (
    <Paper className={classes.paper}>
      <Typography variant="h6" gutterBottom>
        Kubernetes Resources
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Kind</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Age</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {resources.map(resource => (
            <TableRow key={`${resource.kind}-${resource.name}`}>
              <TableCell className={classes.cell}>{resource.kind}</TableCell>
              <TableCell>{resource.name}</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={resource.status}
                  color="primary"
                  variant="outlined"
                />
              </TableCell>
              <TableCell>{resource.age}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
};
