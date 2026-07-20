import { db } from '../db';
import { DoraMetrics } from '../types';

export class DevLakeService {
  async getMetrics(
    repo: string,
    application?: string,
  ): Promise<DoraMetrics> {

    console.log('application parameter =', application);
    console.log('================================');
    console.log('Repository :', repo);
    console.log('Application:', application);

    /**
     * Resolve DevLake project
     */
    const [projectRows] = await db.query(
      `
      SELECT pm.project_name
      FROM _tool_github_repos gr
      JOIN project_mapping pm
        ON pm.row_id = CONCAT(
          'github:GithubRepo:',
          gr.connection_id,
          ':',
          gr.github_id
        )
      WHERE gr.name = ?
        AND pm.\`table\` = 'repos'
      LIMIT 1
      `,
      [repo],
    );

    const projectName =
      (projectRows as any[])[0]?.project_name;

    if (!projectName) {
      return {
        repository: {
          githubRepo: repo,
          argoApplication: '',
        },

        dora: {
          deploymentFrequency: 0,
          leadTime: null,
          mttr: null,
          changeFailureRate: null,
        },

        github: {
          openPullRequests: 0,
          mergedPullRequests: 0,
          commitsLast30Days: 0,
          activeContributors: 0,
        },

        deploymentInsights: {
          deploymentsToday: 0,
          deploymentsThisWeek: 0,
          lastDeployment: null,
          rollbackCount: 0,
        },
      };
    }

    /**
     * Resolve GitHub ID
     */
    const [githubRows] = await db.query(
      `
      SELECT github_id
      FROM _tool_github_repos
      WHERE name = ?
      LIMIT 1
      `,
      [repo],
    );

    const githubId =
      (githubRows as any[])[0]?.github_id;

    /**
     * Resolve ArgoCD application
     */
    const [argoRows] = await db.query(
      `
      SELECT row_id
      FROM project_mapping
      WHERE project_name = ?
        AND \`table\` = '_tool_argocd_applications'
      LIMIT 1
      `,
      [projectName],
    );

    const resolvedApplication =
      (argoRows as any[])[0]?.row_id ?? '';

    const argoApplication =
      application ?? resolvedApplication;

    console.log('Resolved Application:', resolvedApplication);
    console.log('Using Application:', argoApplication);

    /**
     * -----------------------------
     * GitHub Metrics
     * -----------------------------
     */

    const [openPrRows] = await db.query(
      `
      SELECT COUNT(*) AS openPullRequests
      FROM _tool_github_pull_requests
      WHERE repo_id = ?
        AND state = 'OPEN'
      `,
      [githubId],
    );

    const openPullRequests =
      (openPrRows as any[])[0]?.openPullRequests ?? 0;

    const [mergedPrRows] = await db.query(
      `
      SELECT COUNT(*) AS mergedPullRequests
      FROM _tool_github_pull_requests
      WHERE repo_id = ?
        AND state = 'MERGED'
      `,
      [githubId],
    );

    const mergedPullRequests =
      (mergedPrRows as any[])[0]?.mergedPullRequests ?? 0;

    const [commitRows] = await db.query(
      `
      SELECT COUNT(*) AS commitsLast30Days
      FROM _tool_github_commits
      WHERE authored_date >=
        DATE_SUB(NOW(), INTERVAL 30 DAY)
      `,
    );

    const commitsLast30Days =
      (commitRows as any[])[0]?.commitsLast30Days ?? 0;

    const [contributorRows] = await db.query(
      `
      SELECT COUNT(DISTINCT author_name)
      AS activeContributors
      FROM _tool_github_commits
      WHERE authored_date >=
        DATE_SUB(NOW(), INTERVAL 30 DAY)
      `,
    );

    const activeContributors =
      (contributorRows as any[])[0]?.activeContributors ?? 0;
        /**
     * -----------------------------
     * Lead Time
     * -----------------------------
     */
    const [leadTimeRows] = await db.query(
      `
      SELECT AVG(pr_cycle_time) / 3600 AS leadTimeHours
      FROM project_pr_metrics
      WHERE project_name = ?
      `,
      [projectName],
    );

    const leadTimeValue =
      (leadTimeRows as any[])[0]?.leadTimeHours;

    const leadTime =
      leadTimeValue !== null &&
      leadTimeValue !== undefined
        ? Number(leadTimeValue)
        : null;

    /**
     * -----------------------------
     * Change Failure Rate
     * -----------------------------
     */
    const [failureRows] = await db.query(
      `
      SELECT
        ROUND(
          COALESCE(
            SUM(
              CASE
                WHEN result <> 'SUCCESS'
                THEN 1
                ELSE 0
              END
            ) * 100.0 /
            NULLIF(COUNT(*), 0),
            0
          ),
          2
        ) AS changeFailureRate
      FROM cicd_deployments
      WHERE cicd_scope_id LIKE ?
      `,
      [`%${argoApplication}%`],
    );

    const changeFailureRate =
      Number(
        (failureRows as any[])[0]?.changeFailureRate ?? 0,
      );

    /**
     * -----------------------------
     * MTTR
     * -----------------------------
     */
    const mttr = null;

    /**
     * -----------------------------
     * Deployment Frequency
     * -----------------------------
     */
    const [deploymentRows] = await db.query(
      `
      SELECT COUNT(*) AS deploymentFrequency
      FROM cicd_deployments
      WHERE cicd_scope_id LIKE ?
        AND result = 'SUCCESS'
        AND status = 'DONE'
        AND created_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      `,
      [`%${argoApplication}%`],
    );

    const deploymentFrequency =
      (deploymentRows as any[])[0]?.deploymentFrequency ?? 0;

    /**
     * -----------------------------
     * Deployments Today
     * -----------------------------
     */
    const [todayRows] = await db.query(
      `
      SELECT COUNT(*) AS deploymentsToday
      FROM cicd_deployments
      WHERE cicd_scope_id LIKE ?
        AND DATE(created_date) = CURDATE()
        AND result = 'SUCCESS'
        AND status = 'DONE'
      `,
      [`%${argoApplication}%`],
    );

    const deploymentsToday =
      (todayRows as any[])[0]?.deploymentsToday ?? 0;

    /**
     * -----------------------------
     * Deployments This Week
     * -----------------------------
     */
    const [weekRows] = await db.query(
      `
      SELECT COUNT(*) AS deploymentsThisWeek
      FROM cicd_deployments
      WHERE cicd_scope_id LIKE ?
        AND YEARWEEK(created_date, 1) =
            YEARWEEK(CURDATE(), 1)
        AND result = 'SUCCESS'
        AND status = 'DONE'
      `,
      [`%${argoApplication}%`],
    );

    const deploymentsThisWeek =
      (weekRows as any[])[0]?.deploymentsThisWeek ?? 0;

    /**
     * -----------------------------
     * Last Deployment
     * -----------------------------
     */
    const [lastDeploymentRows] = await db.query(
      `
      SELECT created_date
      FROM cicd_deployments
      WHERE cicd_scope_id LIKE ?
        AND result = 'SUCCESS'
        AND status = 'DONE'
      ORDER BY created_date DESC
      LIMIT 1
      `,
      [`%${argoApplication}%`],
    );

    const lastDeployment =
      (lastDeploymentRows as any[])[0]?.created_date ?? null;

    /**
     * -----------------------------
     * Rollback Count
     * -----------------------------
     */
    const rollbackCount = 0;
        /**
     * Final Response
     */
    return {
      repository: {
        githubRepo: repo,
        argoApplication,
      },

      dora: {
        deploymentFrequency,
        leadTime,
        mttr,
        changeFailureRate,
      },

      github: {
        openPullRequests,
        mergedPullRequests,
        commitsLast30Days,
        activeContributors,
      },

      deploymentInsights: {
        deploymentsToday,
        deploymentsThisWeek,
        lastDeployment,
        rollbackCount,
      },
    };
  }
}