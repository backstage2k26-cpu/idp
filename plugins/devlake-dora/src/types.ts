export interface DoraMetrics {
  repository: {
    githubRepo: string;
    argoApplication: string;
  };

  dora: {
    deploymentFrequency: number;
    leadTime: number | null;
    mttr: number | null;
    changeFailureRate: number | null;
  };

  github: {
    openPullRequests: number | null;
    mergedPullRequests: number | null;
    commitsLast30Days: number | null;
    activeContributors: number | null;
  };

  deploymentInsights: {
    deploymentsToday: number;
    deploymentsThisWeek: number;
    lastDeployment: string | null;
    rollbackCount: number;
  };
}