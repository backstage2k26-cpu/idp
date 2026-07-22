import { db } from '../db';
import { DoraMetrics } from '../types';

export class DevLakeService {
  async getMetrics(repo: string, application?: string): Promise<DoraMetrics> {
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

    const projectName = (projectRows as any[])[0]?.project_name;

    if (!projectName) {
      return {
        repository: {
          githubRepo: repo,
          argoApplication: '',
        },

        dora: {
          deploymentFrequency: 0,
          leadTime: null,
          changeFailureRate: null,
        },

        github: {
          openPullRequests: 0,
          mergedPullRequests: 0,
          commitsLast30Days: 0,
          activeContributors: 0,
          lastPullRequest: null,
        },

        deploymentInsights: {
          deploymentsToday: 0,
          deploymentsThisWeek: 0,
          lastDeployment: null,
          rollbackCount: 0,
        },

        releasePromotions: [],
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

    const githubId = (githubRows as any[])[0]?.github_id;

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

    const resolvedApplication = (argoRows as any[])[0]?.row_id ?? '';

    const argoApplication = application ?? resolvedApplication;

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

    const openPullRequests = (openPrRows as any[])[0]?.openPullRequests ?? 0;

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

    const [lastPullRequestRows] = await db.query(
      `
      SELECT github_created_at
      FROM _tool_github_pull_requests
      WHERE repo_id = ?
      ORDER BY github_created_at DESC
      LIMIT 1
      `,
      [githubId],
    );

    const lastPullRequest =
      (lastPullRequestRows as any[])[0]?.github_created_at ?? null;

    const [commitRows] = await db.query(
      `
      SELECT COUNT(*) AS commitsLast30Days
      FROM _tool_github_commits
      WHERE authored_date >=
        DATE_SUB(NOW(), INTERVAL 30 DAY)
      `,
    );

    const commitsLast30Days = (commitRows as any[])[0]?.commitsLast30Days ?? 0;

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

    const githubTrend = [
      {
        metric: 'Open PRs',
        value: openPullRequests,
      },
      {
        metric: 'Merged PRs',
        value: mergedPullRequests,
      },
      {
        metric: 'Commits',
        value: commitsLast30Days,
      },
      {
        metric: 'Contributors',
        value: activeContributors,
      },
    ];
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

    const leadTimeValue = (leadTimeRows as any[])[0]?.leadTimeHours;

    const leadTime =
      leadTimeValue !== null && leadTimeValue !== undefined
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

    const changeFailureRate = Number(
      (failureRows as any[])[0]?.changeFailureRate ?? 0,
    );

    /**
     * -----------------------------
     * Deployment Frequency
     * -----------------------------
     */
    const [deploymentRows] = await db.query(
      `
      SELECT COUNT(DISTINCT revision) AS deploymentFrequency
      FROM _tool_argocd_sync_operations
      WHERE application_name = ?
        AND phase = 'Succeeded'
        AND finished_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      `,
      [argoApplication],
    );

    const deploymentFrequency =
      (deploymentRows as any[])[0]?.deploymentFrequency ?? 0;

    /**
     * -----------------------------
     * Deployment Trend (Last 7 Days)
     * -----------------------------
     */

    const [deploymentTrendRows] = await db.query(
      `
            SELECT
              DATE(CONVERT_TZ(finished_at, '+00:00', '+05:30')) AS deploymentDate,
              COUNT(DISTINCT revision) AS deployments
            FROM _tool_argocd_sync_operations
            WHERE application_name = ?
              AND phase = 'Succeeded'
              AND CONVERT_TZ(finished_at, '+00:00', '+05:30') >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
            GROUP BY DATE(CONVERT_TZ(finished_at, '+00:00', '+05:30'))
            ORDER BY DATE(CONVERT_TZ(finished_at, '+00:00', '+05:30'))
          `,
      [argoApplication],
    );

    const deploymentTrend = (deploymentTrendRows as any[]).map(row => ({
      day: new Date(row.deploymentDate).toLocaleDateString('en-US', {
        weekday: 'short',
      }),
      deployments: Number(row.deployments),
    }));
    /**
     * -----------------------------
     * Deployments Today
     * -----------------------------
     */
    const [todayRows] = await db.query(
      `
      SELECT COUNT(DISTINCT revision) AS deploymentsToday
      FROM _tool_argocd_sync_operations
      WHERE application_name = ?
        AND phase = 'Succeeded'
        AND DATE(CONVERT_TZ(finished_at, '+00:00', '+05:30')) = CURDATE()
      `,
      [argoApplication],
    );

    const deploymentsToday = (todayRows as any[])[0]?.deploymentsToday ?? 0;

    /**
     * -----------------------------
     * Deployments This Week
     * -----------------------------
     */
    const [weekRows] = await db.query(
      `
      SELECT COUNT(DISTINCT revision) AS deploymentsThisWeek
      FROM _tool_argocd_sync_operations
      WHERE application_name = ?
        AND phase = 'Succeeded'
        AND YEARWEEK(CONVERT_TZ(finished_at, '+00:00', '+05:30'), 1) =
            YEARWEEK(CURDATE(), 1)
      `,
      [argoApplication],
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
      SELECT MAX(finished_at) AS finished_at
      FROM _tool_argocd_sync_operations
      WHERE application_name = ?
        AND phase = 'Succeeded'
      `,
      [argoApplication],
    );

    const lastDeployment =
      (lastDeploymentRows as any[])[0]?.finished_at ?? null;

    /**
     * -----------------------------
     * Rollback Count
     * -----------------------------
     */
    const rollbackCount = 0;

    /**
     * -----------------------------
     * Release Promotion History
     * -----------------------------
     */
    const devApp = `${repo}-dev`;
    const qaApp = `${repo}-qa`;
    const prodApp = `${repo}-prod`;

    const [promotionRows] = await db.query(
      `
      WITH latest_dev AS (
          SELECT
              revision,
              MAX(finished_at) AS dev_deployed
          FROM _tool_argocd_sync_operations
          WHERE application_name = ?
            AND phase = 'Succeeded'
          GROUP BY revision
          ORDER BY dev_deployed DESC
          LIMIT 5
      ),

      revision_images AS (
          SELECT
              revision,
              MAX(images) AS images
          FROM _tool_argocd_revision_images
          GROUP BY revision
      )

      SELECT

          SUBSTRING_INDEX(
              JSON_UNQUOTE(JSON_EXTRACT(ri.images,'$[0]')),
              ':',
              -1
          ) AS image_version,

          d.revision,

          d.dev_deployed,

          MIN(q.finished_at) AS qa_deployed,

          MIN(p.finished_at) AS prod_deployed,

          ROUND(
              TIMESTAMPDIFF(
                  SECOND,
                  d.dev_deployed,
                  MIN(q.finished_at)
              ) / 60,
              2
          ) AS dev_to_qa_minutes,

          ROUND(
              TIMESTAMPDIFF(
                  SECOND,
                  MIN(q.finished_at),
                  MIN(p.finished_at)
              ) / 60,
              2
          ) AS qa_to_prod_minutes,

          ROUND(
              TIMESTAMPDIFF(
                  SECOND,
                  d.dev_deployed,
                  MIN(p.finished_at)
              ) / 60,
              2
          ) AS dev_to_prod_minutes,

          CASE
              WHEN MIN(q.finished_at) IS NULL THEN 'Waiting for QA'
              WHEN MIN(p.finished_at) IS NULL THEN 'Waiting for Prod'
              WHEN TIMESTAMPDIFF(
                      SECOND,
                      d.dev_deployed,
                      MIN(q.finished_at)
                  ) < 0 THEN 'QA Before Dev'
              WHEN TIMESTAMPDIFF(
                      SECOND,
                      MIN(q.finished_at),
                      MIN(p.finished_at)
                  ) < 0 THEN 'Prod Before QA'
              ELSE 'Completed'
          END AS promotion_status

      FROM latest_dev d

      LEFT JOIN revision_images ri
            ON ri.revision = d.revision

      LEFT JOIN _tool_argocd_sync_operations q
            ON q.revision = d.revision
            AND q.application_name = ?
            AND q.phase = 'Succeeded'

      LEFT JOIN _tool_argocd_sync_operations p
            ON p.revision = d.revision
            AND p.application_name = ?
            AND p.phase = 'Succeeded'

      GROUP BY
          d.revision,
          ri.images,
          d.dev_deployed

      ORDER BY
          d.dev_deployed DESC
      `,
      [devApp, qaApp, prodApp],
    );

    const releasePromotions = (promotionRows as any[]).map(row => ({
      imageVersion: row.image_version,
      revision: row.revision,
      devDeployed: row.dev_deployed,
      qaDeployed: row.qa_deployed,
      prodDeployed: row.prod_deployed,
      devToQaMinutes: row.dev_to_qa_minutes,
      qaToProdMinutes: row.qa_to_prod_minutes,
      devToProdMinutes: row.dev_to_prod_minutes,
      promotionStatus: row.promotion_status,
    }));
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
        changeFailureRate,
      },

      github: {
        openPullRequests,
        mergedPullRequests,
        commitsLast30Days,
        activeContributors,
        lastPullRequest,
      },

      deploymentInsights: {
        deploymentsToday,
        deploymentsThisWeek,
        lastDeployment,
        rollbackCount,
      },

      deploymentTrend,
      githubTrend,

      releasePromotions,
    };
  }
}
