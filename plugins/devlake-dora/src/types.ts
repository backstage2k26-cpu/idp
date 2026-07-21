export interface ReleasePromotion {
  imageVersion: string;
  revision: string;

  devDeployed: string | null;
  qaDeployed: string | null;
  prodDeployed: string | null;

  devToQaMinutes: number | null;
  qaToProdMinutes: number | null;
  devToProdMinutes: number | null;

  promotionStatus: string;
}

export interface DoraMetrics {
  repository: {
    githubRepo: string;
    argoApplication: string;
  };

  dora: {
    deploymentFrequency: number;
    leadTime: number | null;
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

  releasePromotions: ReleasePromotion[];
}