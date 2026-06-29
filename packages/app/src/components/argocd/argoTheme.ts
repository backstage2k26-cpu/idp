export const ARGO_COLORS = {
  orange: '#EF7B4D',
  orangeDark: '#E96533',
  orangeDeeper: '#D4532B',
  orangeLight: '#FFF0E9',
  orangeMuted: '#FFDCC8',
  navy: '#213743',
  navyDark: '#1A2B34',
  surface: '#ffffff',
  border: '#E4E7EB',
  textPrimary: '#212529',
  textSecondary: '#6C757D',
  healthy: '#18BE94',
  healthyBg: 'rgba(24, 190, 148, 0.12)',
  degraded: '#E96D76',
  degradedBg: 'rgba(233, 109, 118, 0.12)',
  progressing: '#0DADEA',
  progressingBg: 'rgba(13, 173, 234, 0.12)',
  synced: '#18BE94',
  syncedBg: 'rgba(24, 190, 148, 0.12)',
  outOfSync: '#F4C430',
  outOfSyncBg: 'rgba(244, 196, 48, 0.15)',
  unknown: '#8FA4B1',
  unknownBg: 'rgba(143, 164, 177, 0.15)',
};

export const ARGO_ENV_COLORS: Record<string, string> = {
  dev: ARGO_COLORS.orange,
  development: ARGO_COLORS.orange,
  qa: ARGO_COLORS.outOfSync,
  test: ARGO_COLORS.outOfSync,
  staging: ARGO_COLORS.progressing,
  prod: ARGO_COLORS.healthy,
  production: ARGO_COLORS.healthy,
};

export const getArgoEnvironmentColor = (environment: string): string =>
  ARGO_ENV_COLORS[environment.toLowerCase()] ?? ARGO_COLORS.orangeDark;

export type ArgoStatusTone =
  | 'healthy'
  | 'degraded'
  | 'progressing'
  | 'synced'
  | 'outOfSync'
  | 'unknown'
  | 'suspended';

export const getArgoStatusTone = (status: string): ArgoStatusTone => {
  const normalized = status.toLowerCase().replace(/\s+/g, '');

  if (normalized === 'healthy' || normalized === 'synced') {
    return normalized === 'synced' ? 'synced' : 'healthy';
  }
  if (normalized === 'degraded' || normalized === 'failed') {
    return 'degraded';
  }
  if (normalized === 'progressing' || normalized === 'running') {
    return 'progressing';
  }
  if (normalized === 'outofsync') {
    return 'outOfSync';
  }
  if (normalized === 'suspended' || normalized === 'skipped') {
    return 'suspended';
  }

  return 'unknown';
};

export const ARGO_STATUS_STYLES: Record<
  ArgoStatusTone,
  { background: string; color: string }
> = {
  healthy: { background: ARGO_COLORS.healthyBg, color: ARGO_COLORS.healthy },
  synced: { background: ARGO_COLORS.syncedBg, color: ARGO_COLORS.synced },
  degraded: { background: ARGO_COLORS.degradedBg, color: ARGO_COLORS.degraded },
  progressing: {
    background: ARGO_COLORS.progressingBg,
    color: ARGO_COLORS.progressing,
  },
  outOfSync: {
    background: ARGO_COLORS.outOfSyncBg,
    color: '#B8860B',
  },
  unknown: { background: ARGO_COLORS.unknownBg, color: ARGO_COLORS.unknown },
  suspended: { background: ARGO_COLORS.unknownBg, color: ARGO_COLORS.unknown },
};
