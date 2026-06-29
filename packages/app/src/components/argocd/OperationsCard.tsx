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
} from '@material-ui/core';
import { ArgoCdOperationItem } from './types';
import { StatusChip } from './StatusChip';

const useStyles = makeStyles(theme => ({
  paper: { padding: theme.spacing(2), height: '100%' },
}));

export const OperationsCard = ({
  operations,
}: {
  operations: ArgoCdOperationItem[];
}) => {
  const classes = useStyles();

  return (
    <Paper className={classes.paper}>
      <Typography variant="h6" gutterBottom>
        Recent Operations
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Status</TableCell>
            <TableCell>Message</TableCell>
            <TableCell>Duration</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {operations.map(operation => (
            <TableRow key={`${operation.status}-${operation.message}`}>
              <TableCell>
                <StatusChip label={operation.status} />
              </TableCell>
              <TableCell>{operation.message}</TableCell>
              <TableCell>{operation.duration}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
};
