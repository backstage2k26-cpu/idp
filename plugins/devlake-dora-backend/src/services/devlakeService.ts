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
    const appBaseName =
      (argoApplication || application || repo).replace(
        /-(dev|qa|prod)$/i,
        '',
      );
    const devApp = `${appBaseName}-dev`;
    const qaApp = `${appBaseName}-qa`;
    const prodApp = `${appBaseName}-prod`;

    const [promotionRows] = await db.query(
      `
      WITH deployments AS (
          SELECT DISTINCT
              s.application_name,
              s.revision,
              s.finished_at,
              SUBSTRING_INDEX(
                  JSON_UNQUOTE(JSON_EXTRACT(r.images, '$[0]')),
                  ':',
                  -1
              ) AS image_version
          FROM _tool_argocd_sync_operations s
          LEFT JOIN _tool_argocd_revision_images r
              ON s.revision = r.revision
          WHERE s.phase = 'Succeeded'
      ),

      latest_dev AS (
          SELECT
              image_version,
              revision,
              finished_at AS dev_deployed
          FROM (
              SELECT
                  image_version,
                  revision,
                  finished_at,
                  ROW_NUMBER() OVER (
                      PARTITION BY image_version
                      ORDER BY finished_at DESC
                  ) AS rn
              FROM deployments
              WHERE application_name = ${db.escape(devApp)}
          ) t
          WHERE rn = 1
          ORDER BY dev_deployed DESC
          LIMIT 3
      )

      SELECT
          d.image_version,
          d.revision AS dev_revision,
          d.dev_deployed,
          (
              SELECT MIN(q.finished_at)
              FROM deployments q
              WHERE q.application_name = ${db.escape(qaApp)}
                AND q.image_version = d.image_version
                AND q.finished_at >= d.dev_deployed
          ) AS qa_deployed,
          (
              SELECT MIN(p.finished_at)
              FROM deployments p
              WHERE p.application_name = ${db.escape(prodApp)}
                AND p.image_version = d.image_version
                AND p.finished_at >= (
                    SELECT MIN(q.finished_at)
                    FROM deployments q
                    WHERE q.application_name = ${db.escape(qaApp)}
                      AND q.image_version = d.image_version
                      AND q.finished_at >= d.dev_deployed
                )
          ) AS prod_deployed,
          ROUND(
              TIMESTAMPDIFF(
                  SECOND,
                  d.dev_deployed,
                  (
                      SELECT MIN(q.finished_at)
                      FROM deployments q
                      WHERE q.application_name = ${db.escape(qaApp)}
                        AND q.image_version = d.image_version
                        AND q.finished_at >= d.dev_deployed
                  )
              ) / 60,
              2
          ) AS dev_to_qa_minutes,
          ROUND(
              TIMESTAMPDIFF(
                  SECOND,
                  (
                      SELECT MIN(q.finished_at)
                      FROM deployments q
                      WHERE q.application_name = ${db.escape(qaApp)}
                        AND q.image_version = d.image_version
                        AND q.finished_at >= d.dev_deployed
                  ),
                  (
                      SELECT MIN(p.finished_at)
                      FROM deployments p
                      WHERE p.application_name = ${db.escape(prodApp)}
                        AND p.image_version = d.image_version
                        AND p.finished_at >= (
                            SELECT MIN(q.finished_at)
                            FROM deployments q
                            WHERE q.application_name = ${db.escape(qaApp)}
                              AND q.image_version = d.image_version
                              AND q.finished_at >= d.dev_deployed
                        )
                  )
              ) / 60,
              2
          ) AS qa_to_prod_minutes,
          ROUND(
              TIMESTAMPDIFF(
                  SECOND,
                  d.dev_deployed,
                  (
                      SELECT MIN(p.finished_at)
                      FROM deployments p
                      WHERE p.application_name = ${db.escape(prodApp)}
                        AND p.image_version = d.image_version
                  )
              ) / 60,
              2
          ) AS dev_to_prod_minutes,
          CASE
              WHEN (
                  SELECT MIN(q.finished_at)
                  FROM deployments q
                  WHERE q.application_name = ${db.escape(qaApp)}
                    AND q.image_version = d.image_version
                    AND q.finished_at >= d.dev_deployed
              ) IS NULL
              THEN 'Waiting for QA'
              WHEN (
                  SELECT MIN(p.finished_at)
                  FROM deployments p
                  WHERE p.application_name = ${db.escape(prodApp)}
                    AND p.image_version = d.image_version
                    AND p.finished_at >= (
                        SELECT MIN(q.finished_at)
                        FROM deployments q
                        WHERE q.application_name = ${db.escape(qaApp)}
                          AND q.image_version = d.image_version
                          AND q.finished_at >= d.dev_deployed
                    )
              ) IS NULL
              THEN 'Waiting for Prod'
              ELSE 'Completed'
          END AS promotion_status

      FROM latest_dev d

      ORDER BY d.dev_deployed DESC;
      `,
      [],
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
