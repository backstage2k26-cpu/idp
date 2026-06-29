import { AssetServiceClient } from '@google-cloud/asset';
import { LoggerService } from '@backstage/backend-plugin-api';
import { InfrastructureResource } from './types';
import { extractResourceName, matchesExpectedLabels } from './labelMatching';

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  'container.googleapis.com/Cluster': 'GKE Cluster',
  'sqladmin.googleapis.com/Instance': 'Cloud SQL',
  'pubsub.googleapis.com/Topic': 'Pub/Sub Topic',
  'pubsub.googleapis.com/Subscription': 'Pub/Sub Subscription',
  'bigquery.googleapis.com/Dataset': 'BigQuery Dataset',
  'storage.googleapis.com/Bucket': 'Cloud Storage Bucket',
  'redis.googleapis.com/Instance': 'Memorystore',
  'secretmanager.googleapis.com/Secret': 'Secret Manager',
  'artifactregistry.googleapis.com/Repository': 'Artifact Registry',
  'compute.googleapis.com/ForwardingRule': 'Load Balancer',
  'compute.googleapis.com/UrlMap': 'Load Balancer',
  'run.googleapis.com/Service': 'Cloud Run',
  'compute.googleapis.com/Network': 'VPC',
  'iam.googleapis.com/ServiceAccount': 'Service Account',
};

const DEFAULT_LABEL_KEYS = {
  application: 'app',
  environment: 'env',
};

const getResourceTypeLabel = (assetType: string | undefined): string => {
  if (!assetType) {
    return 'Unknown';
  }

  if (RESOURCE_TYPE_LABELS[assetType]) {
    return RESOURCE_TYPE_LABELS[assetType];
  }

  const shortType = assetType.split('/').pop() ?? assetType;
  return shortType.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
};

const escapeQueryValue = (value: string): string => {
  if (/^[a-zA-Z0-9_-]+$/.test(value)) {
    return value;
  }

  return `"${value.replace(/"/g, '\\"')}"`;
};

const buildLabelQuery = (
  labelKey: string,
  labelValue: string,
): string => `labels.${labelKey}:${escapeQueryValue(labelValue)}`;

export type LabelKeys = {
  application: string;
  environment: string;
};

export type CloudAssetClientOptions = {
  logger: LoggerService;
  labelKeys?: LabelKeys;
};

export class CloudAssetClient {
  private readonly client: AssetServiceClient;
  private readonly logger: LoggerService;
  private readonly labelKeys: LabelKeys;

  constructor(options: CloudAssetClientOptions) {
    this.client = new AssetServiceClient();
    this.logger = options.logger;
    this.labelKeys = options.labelKeys ?? DEFAULT_LABEL_KEYS;
  }

  async searchResources(options: {
    projectId: string;
    application: string;
    environment: string;
  }): Promise<InfrastructureResource[]> {
    const { projectId, application, environment } = options;
    const scope = `projects/${projectId}`;
    const appQuery = buildLabelQuery(this.labelKeys.application, application);
    const envQuery = buildLabelQuery(this.labelKeys.environment, environment);

    const queries = [
      `${appQuery} AND ${envQuery}`,
      appQuery,
    ];

    const resourcesByName = new Map<string, InfrastructureResource>();

    for (const query of queries) {
      const verifyLabels = query === appQuery;

      this.logger.info(
        `Searching GCP assets in ${scope} with query: ${query}`,
      );

      const iterable = this.client.searchAllResourcesAsync({
        scope,
        query,
      });

      for await (const asset of iterable) {
        if (!asset.name) {
          continue;
        }

        if (
          verifyLabels &&
          !matchesExpectedLabels(asset.labels ?? undefined, {
            application,
            environment,
          }, this.labelKeys)
        ) {
          continue;
        }

        if (resourcesByName.has(asset.name)) {
          continue;
        }

        resourcesByName.set(asset.name, {
          type: getResourceTypeLabel(asset.assetType),
          name: extractResourceName(asset.name),
          assetType: asset.assetType,
        });
      }
    }

    const resources = Array.from(resourcesByName.values());

    resources.sort((left, right) => {
      const typeCompare = left.type.localeCompare(right.type);
      if (typeCompare !== 0) {
        return typeCompare;
      }
      return left.name.localeCompare(right.name);
    });

    this.logger.info(
      `Found ${resources.length} GCP assets for ${application}/${environment} in ${scope}: ${resources
        .map(resource => `${resource.type}:${resource.name}`)
        .join(', ') || 'none'}`,
    );

    return resources;
  }
}
