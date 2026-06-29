export const GCP_COLORS = {
  blue: '#4285F4',
  blueDark: '#1967d2',
  blueDeeper: '#174ea6',
  blueLight: '#e8f0fe',
  blueMuted: '#d2e3fc',
  surface: '#ffffff',
  border: '#dadce0',
  textPrimary: '#202124',
  textSecondary: '#5f6368',
  green: '#34a853',
  yellow: '#f9ab00',
  red: '#ea4335',
  purple: '#9334e6',
  teal: '#00897b',
  orange: '#e8710a',
};

export const ENVIRONMENT_COLORS: Record<string, string> = {
  dev: GCP_COLORS.blue,
  development: GCP_COLORS.blue,
  qa: GCP_COLORS.yellow,
  test: GCP_COLORS.yellow,
  staging: GCP_COLORS.purple,
  perf: GCP_COLORS.purple,
  performance: GCP_COLORS.purple,
  prod: GCP_COLORS.green,
  production: GCP_COLORS.green,
};

export const getEnvironmentColor = (environment: string): string =>
  ENVIRONMENT_COLORS[environment.toLowerCase()] ?? GCP_COLORS.blueDark;

export const RESOURCE_TYPE_COLORS: Record<string, string> = {
  'GKE Cluster': GCP_COLORS.blue,
  'Cloud SQL': GCP_COLORS.blueDark,
  'Pub/Sub Topic': GCP_COLORS.purple,
  'Pub/Sub Subscription': '#7b1fa2',
  'BigQuery Dataset': GCP_COLORS.teal,
  'Cloud Storage Bucket': GCP_COLORS.orange,
  Memorystore: GCP_COLORS.red,
  'Secret Manager': '#5f6368',
  'Artifact Registry': GCP_COLORS.blue,
  'Load Balancer': GCP_COLORS.green,
  'Cloud Run': GCP_COLORS.blue,
  VPC: GCP_COLORS.teal,
  'Service Account': GCP_COLORS.yellow,
};

export const getResourceTypeColor = (type: string): string =>
  RESOURCE_TYPE_COLORS[type] ?? GCP_COLORS.blueDark;
