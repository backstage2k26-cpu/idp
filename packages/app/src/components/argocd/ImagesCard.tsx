import React from 'react';
import { Paper, Typography, makeStyles, Chip } from '@material-ui/core';
import { ArgoCdImage } from './types';

const useStyles = makeStyles(theme => ({
  paper: { padding: theme.spacing(2), height: '100%' },
  list: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    marginTop: theme.spacing(1.5),
  },
}));

export const ImagesCard = ({ images }: { images: ArgoCdImage[] }) => {
  const classes = useStyles();

  return (
    <Paper className={classes.paper}>
      <Typography variant="h6">Images</Typography>
      <div className={classes.list}>
        {images.map(image => (
          <Chip
            key={`${image.repository}:${image.tag}`}
            label={`${image.repository}:${image.tag}`}
          />
        ))}
      </div>
    </Paper>
  );
};
