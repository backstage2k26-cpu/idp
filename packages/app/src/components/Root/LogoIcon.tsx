import { makeStyles } from '@material-ui/core';

const useStyles = makeStyles({
  root: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 700,
    lineHeight: 1,
    letterSpacing: '0.02em',
  },
});

const LogoIcon = () => {
  const classes = useStyles();

  return (
    <span className={classes.root} aria-label="Platform Portal">
      PP
    </span>
  );
};

export default LogoIcon;
