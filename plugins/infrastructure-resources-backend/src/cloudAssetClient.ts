import { AssetServiceClient } from '@google-cloud/asset';
import { LoggerService } from '@backstage/backend-plugin-api';
import { InfrastructureResource } from './types';
import {
  extractResourceName,
  matchesExpectedLabels,
  parseApplicationNames,
} from './labelMatching';

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

const buildLabelQuery = (labelKey: string, labelValue: string): string =>
  `labels.${labelKey}:${escapeQueryValue(labelValue)}`;

const resourceKey = (resource: InfrastructureResource): string =>
  `${resource.assetType ?? resource.type}:${resource.name}`;

export type LabelKeys = {
  application: string;
  environment: string;
};

export type CloudAssetSearchOptions = {
  projectId: string;
  application: string;
  applications?: string[];
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

  async searchResources(
    options: CloudAssetSearchOptions,
  ): Promise<InfrastructureResource[]> {
    const { projectId, environment } = options;
    const applicationNames = this.resolveApplicationNames(options);
    const scope = `projects/${projectId}`;
    const resourcesByName = new Map<string, InfrastructureResource>();

    for (const applicationName of applicationNames) {
      const appQuery = buildLabelQuery(
        this.labelKeys.application,
        applicationName,
      );
      const envQuery = buildLabelQuery(this.labelKeys.environment, environment);
      const primaryQuery = `${appQuery} AND ${envQuery}`;

      this.logger.info(
        `Searching GCP assets in ${scope} with query: ${primaryQuery}`,
      );

      for (const resource of await this.runSearch(scope, primaryQuery, {
        application: applicationName,
        applications: applicationNames,
        environment,
        verifyEnvironment: false,
      })) {
        resourcesByName.set(resourceKey(resource), resource);
      }

      this.logger.info(
        `Searching GCP assets in ${scope} with app fallback query: ${appQuery}`,
      );

      for (const resource of await this.runSearch(scope, appQuery, {
        application: applicationName,
        applications: applicationNames,
        environment,
        verifyEnvironment: true,
      })) {
        resourcesByName.set(resourceKey(resource), resource);
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
      `Found ${resources.length} GCP assets for ${applicationNames.join(
        ',',
      )}/${environment} in ${scope}: ${
        resources
          .map(resource => `${resource.type}:${resource.name}`)
          .join(', ') || 'none'
      }`,
    );

    return resources;
  }

  private resolveApplicationNames(options: CloudAssetSearchOptions): string[] {
    if (options.applications && options.applications.length > 0) {
      return options.applications;
    }

    const parsed = parseApplicationNames(options.application);
    return parsed.length > 0 ? parsed : [options.application];
  }

  private async runSearch(
    scope: string,
    query: string,
    options: {
      application: string;
      applications: string[];
      environment: string;
      verifyEnvironment: boolean;
    },
  ): Promise<InfrastructureResource[]> {
    const resourcesByName = new Map<string, InfrastructureResource>();
    const iterable = this.client.searchAllResourcesAsync({
      scope,
      query,
    });

    for await (const asset of iterable) {
      if (!asset.name) {
        continue;
      }

      if (
        options.verifyEnvironment &&
        !matchesExpectedLabels(
          asset.labels ?? undefined,
          {
            application: options.application,
            applications: options.applications,
            environment: options.environment,
          },
          this.labelKeys,
        )
      ) {
        continue;
      }

      const resource: InfrastructureResource = {
        type: getResourceTypeLabel(asset.assetType),
        name: extractResourceName(asset.name),
        assetType: asset.assetType,
        fullName: asset.name,
      };

      resourcesByName.set(resourceKey(resource), resource);
    }

    return Array.from(resourcesByName.values());
  }
}
