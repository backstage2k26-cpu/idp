import React, { useMemo, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  Box,
  Button,
  IconButton,
  Paper,
  TextField,
  Typography,
} from '@material-ui/core';
import { useApi, discoveryApiRef } from '@backstage/core-plugin-api';
import type { LdapSignInPageProps } from '@immobiliarelabs/backstage-plugin-ldap-auth';
import {
  Visibility,
  VisibilityOff,
  PersonOutline,
  LockOutlined,
} from '@material-ui/icons';

class LdapSessionIdentity {
  constructor(
    private readonly options: {
      provider: string;
      discoveryApi: any;
    },
  ) {}

  private session: any | null = null;

  async login(auth: { username: string; password: string }) {
    const baseUrl = await this.options.discoveryApi.getBaseUrl('auth');

    const response = await fetch(
      `${baseUrl}/${this.options.provider}/refresh`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-requested-with': 'XMLHttpRequest',
        },
        credentials: 'include',
        body: JSON.stringify(auth),
      },
    );

    if (!response.ok) {
      throw new Error(await response.text());
    }

    this.session = await response.json();

    console.log(this.session);

    return this.session;
  }

  async getBackstageIdentity() {
    return this.session.backstageIdentity;
  }

  async getProfileInfo() {
    return this.session.profile ?? {};
  }

  async getCredentials() {
    return {
      token: this.session.backstageIdentity?.token,
    };
  }

  async signOut() {
    const baseUrl = await this.options.discoveryApi.getBaseUrl('auth');

    await fetch(`${baseUrl}/${this.options.provider}/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    this.session = null;
  }
}

const useStyles = makeStyles({
  root: {
    position: 'fixed',
    inset: 0,
    overflow: 'hidden',
    background:
      'linear-gradient(180deg, #0E1633 0%, #121B3F 48%, #1A224B 100%)',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      backgroundImage:
        'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
      backgroundSize: '85px 85px',
      opacity: 0.16,
      pointerEvents: 'none',
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      inset: 0,
      background:
        'radial-gradient(circle at center, rgba(68, 132, 255, 0.18) 0%, rgba(68, 132, 255, 0.10) 22%, rgba(14, 22, 51, 0) 60%)',
      pointerEvents: 'none',
    },
  },
  shell: {
    position: 'relative',
    zIndex: 1,
    width: 'min(100%, 760px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    transform: 'translateY(35px)',
  },
  markerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  markerLine: {
    width: 76,
    height: 2,
    background: 'linear-gradient(90deg, transparent, rgba(64, 142, 255, 0.9))',
    borderRadius: 999,
  },
  markerLineRight: {
    background: 'linear-gradient(90deg, rgba(64, 142, 255, 0.9), transparent)',
  },
  markerDot: {
    width: 14,
    height: 14,
    borderRadius: '50%',
    background: '#3A8BFF',
    boxShadow: '0 0 18px rgba(58, 139, 255, 0.95)',
  },
  title: {
    fontSize: 42,
    lineHeight: 1.1,
    fontWeight: 700,
    letterSpacing: '0.16em',
    textIndent: '0.16em',
    marginBottom: 14,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 18,
    lineHeight: 1.4,
    marginBottom: 34,
    fontWeight: 500,
  },
  card: {
    width: 'min(100%, 560px)',
    borderRadius: 20,
    background: 'linear-gradient(180deg, rgba(66, 82, 168, 0.62) 0%, rgba(36, 49, 124, 0.74) 100%)',
    boxShadow:
      '0 18px 42px rgba(2, 8, 32, 0.38), inset 0 1px 0 rgba(255,255,255,0.08)',
    border: '1px solid rgba(146, 174, 255, 0.26)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    padding: '28px 26px 28px',
    textAlign: 'left',
  },
  label: {
    color: '#EAF0FF',
    textTransform: 'uppercase',
    fontWeight: 800,
    letterSpacing: '0.06em',
    fontSize: 13,
    marginBottom: 10,
    display: 'block',
  },
  asterisk: {
    color: '#FF5E6D',
    marginLeft: 4,
  },
  input: {
    marginBottom: 22,
    '& .MuiInputBase-root': {
      minHeight: 64,
      borderRadius: 12,
      backgroundColor: 'rgba(226, 236, 255, 0.84)',
      color: '#121A3A',
      border: '1px solid rgba(173, 198, 255, 0.42)',
      transition:
        'border-color 220ms ease, box-shadow 220ms ease, transform 220ms ease, background-color 220ms ease',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.72)',
    },
    '& .MuiInputBase-root:hover': {
      borderColor: 'rgba(132, 164, 255, 0.72)',
      backgroundColor: 'rgba(232, 240, 255, 0.92)',
    },
    '& .Mui-focused.MuiInputBase-root': {
      borderColor: '#3A8BFF',
      boxShadow: '0 0 0 3px rgba(58, 139, 255, 0.18), inset 0 1px 0 rgba(255,255,255,0.82)',
      backgroundColor: 'rgba(236, 243, 255, 0.98)',
    },
    '& .MuiOutlinedInput-notchedOutline': {
      border: 'none',
    },
    '& .MuiInputBase-input': {
      padding: '18px 18px',
      fontSize: 17,
      lineHeight: 1.2,
    },
    '& .MuiInputBase-input::placeholder': {
      color: 'rgba(18, 26, 58, 0.42)',
      opacity: 1,
    },
  },
  adornment: {
    color: 'rgba(18, 26, 58, 0.52)',
    marginRight: 8,
    display: 'flex',
    alignItems: 'center',
  },
  iconButton: {
    color: 'rgba(18, 26, 58, 0.52)',
  },
  button: {
    width: '100%',
    height: 62,
    marginTop: 10,
    borderRadius: 12,
    background: 'linear-gradient(180deg, #2E78FF 0%, #0B57FF 100%)',
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 800,
    letterSpacing: '0.12em',
    boxShadow: '0 16px 28px rgba(10, 87, 255, 0.36), inset 0 1px 0 rgba(255,255,255,0.18)',
    transition:
      'transform 220ms ease, box-shadow 220ms ease, filter 220ms ease',
    '&:hover': {
      background: 'linear-gradient(180deg, #3F86FF 0%, #165EFF 100%)',
      boxShadow: '0 18px 30px rgba(10, 87, 255, 0.44)',
      transform: 'translateY(-1px)',
    },
    '&:active': {
      transform: 'translateY(1px)',
    },
  },
  footer: {
    marginTop: 28,
    color: 'rgba(255,255,255,0.30)',
    fontSize: 16,
  },
});

export const LdapSignInPage = (props: LdapSignInPageProps) => {
  const classes = useStyles();
  const discoveryApi = useApi(discoveryApiRef);
  const identity = useMemo(
    () => new LdapSessionIdentity({ provider: 'ldap', discoveryApi }),
    [discoveryApi],
  );

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await identity.login({ username, password });
      props.onSignInSuccess(identity as any);
    } catch (error) {
      props.onSignInError?.(error as Error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box className={classes.root}>
      <Box className={classes.shell}>

        <Typography component="h1" className={classes.title}>
          PLATFORM PORTAL
        </Typography>
        <Typography component="p" className={classes.subtitle}>
          
        </Typography>
        <Paper className={classes.card} elevation={0}>
          <form onSubmit={onSubmit} noValidate>
            <label className={classes.label} htmlFor="ldap-username">
              USER NAME<span className={classes.asterisk}>*</span>
            </label>
            <TextField
              id="ldap-username"
              className={classes.input}
              variant="outlined"
              fullWidth
              value={username}
              onChange={event => setUsername(event.target.value)}
              placeholder="your.name"
              autoComplete="username"
              InputProps={{
                startAdornment: (
                  <span className={classes.adornment}>
                    <PersonOutline fontSize="small" />
                  </span>
                ),
              }}
            />

            <label className={classes.label} htmlFor="ldap-password">
              PASSWORD<span className={classes.asterisk}>*</span>
            </label>
            <TextField
              id="ldap-password"
              className={classes.input}
              variant="outlined"
              fullWidth
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={event => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              InputProps={{
                startAdornment: (
                  <span className={classes.adornment}>
                    <LockOutlined fontSize="small" />
                  </span>
                ),
                endAdornment: (
                  <IconButton
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                    onClick={() => setShowPassword(prev => !prev)}
                    edge="end"
                    size="small"
                    className={classes.iconButton}
                  >
                    {showPassword ? (
                      <VisibilityOff fontSize="small" />
                    ) : (
                      <Visibility fontSize="small" />
                    )}
                  </IconButton>
                ),
              }}
            />

            <Button
              type="submit"
              className={classes.button}
              variant="contained"
              color="primary"
              disabled={submitting}
            >
              LOGIN
            </Button>
          </form>
        </Paper>

        <Typography component="p" className={classes.footer}>
          © 2026 All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};
