import { makeStyles } from '@material-ui/core';
import LogoIcon from './LogoIcon';

const useStyles = makeStyles({
  root: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    color: '#7df3e1',
    fontSize: 24,
    fontWeight: 500,
    lineHeight: 1,
    whiteSpace: 'nowrap',
  },
});

const LogoFull = () => {
  const classes = useStyles();

  return (
    <span className={classes.root}>
      <LogoIcon />
      <span>Platform Portal</span>
    </span>
  );
};

export default LogoFull;
