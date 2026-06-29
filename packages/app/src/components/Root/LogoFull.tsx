import { makeStyles } from '@material-ui/core';

const useStyles = makeStyles({
  root: {
    display: 'inline-flex',
    alignItems: 'center',
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 500,
    lineHeight: 1,
    whiteSpace: 'nowrap',
  },
});

const LogoFull = () => {
  const classes = useStyles();

  return <span className={classes.root}>Platform Portal</span>;
};

export default LogoFull;
