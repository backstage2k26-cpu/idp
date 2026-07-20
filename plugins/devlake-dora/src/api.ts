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
  }
}

export async function getDoraMetrics(
  project: string,
  application?: string,
): Promise<DoraMetrics> {
  let url = `http://localhost:7007/api/devlake-dora/dora/${encodeURIComponent(
    project,
  )}`;

  if (application) {
    url += `?application=${encodeURIComponent(application)}`;
  }

  console.log('Calling URL:', url);

  const response = await fetch(url);

  console.log('Status:', response.status);

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}