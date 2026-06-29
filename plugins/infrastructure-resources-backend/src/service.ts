import { Config } from '@backstage/config';
import { Entity } from '@backstage/catalog-model';
import { LoggerService } from '@backstage/backend-plugin-api';
import { CloudAssetClient } from './cloudAssetClient';
import { PubSubResourceProvider } from './pubsubResourceProvider';
import { parseInfrastructureConfig } from './entityParser';
import { mergeResources } from './resourceMerge';
import { TtlCache } from './cache';
import { EnvironmentResources, InfrastructureResourcesResponse } from './types';

const DEFAULT_CACHE_TTL_MINUTES = 7;

export type InfrastructureResourcesServiceOptions = {
  logger: LoggerService;
  config: Config;
  cloudAssetClient: CloudAssetClient;
  pubSubResourceProvider: PubSubResourceProvider;
};

export class InfrastructureResourcesService {
  private readonly logger: LoggerService;
  private readonly cloudAssetClient: CloudAssetClient;
  private readonly pubSubResourceProvider: PubSubResourceProvider;
  private readonly cache: TtlCache<InfrastructureResourcesResponse>;
  private readonly applicationAnnotation?: string;
  private readonly infrastructureAnnotation?: string;

  constructor(options: InfrastructureResourcesServiceOptions) {
    const pluginConfig = options.config.getOptionalConfig(
      'infrastructureResources',
    );
    const cacheTtlMinutes =
      pluginConfig?.getOptionalNumber('cacheTtlMinutes') ??
      DEFAULT_CACHE_TTL_MINUTES;

    this.logger = options.logger;
    this.cloudAssetClient = options.cloudAssetClient;
    this.pubSubResourceProvider = options.pubSubResourceProvider;
    this.cache = new TtlCache(cacheTtlMinutes * 60 * 1000);
    this.applicationAnnotation = pluginConfig?.getOptionalString(
      'applicationAnnotation',
    );
    this.infrastructureAnnotation = pluginConfig?.getOptionalString(
      'infrastructureAnnotation',
    );
  }

  private getCacheKey(entity: Entity): string {
    return `${entity.kind}:${entity.metadata.namespace ?? 'default'}/${
      entity.metadata.name
    }`;
  }

  async getResourcesForEntity(options: {
    entity: Entity;
    refresh?: boolean;
  }): Promise<InfrastructureResourcesResponse> {
    const { entity, refresh = false } = options;
    const cacheKey = this.getCacheKey(entity);

    if (!refresh) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }
    } else {
      this.cache.delete(cacheKey);
    }

    const { application, environments } = parseInfrastructureConfig(entity, {
      applicationAnnotation: this.applicationAnnotation,
      infrastructureAnnotation: this.infrastructureAnnotation,
    });

    const environmentResults = await Promise.all(
      environments.map(environment =>
        this.fetchEnvironmentResources(application, environment),
      ),
    );

    const response: InfrastructureResourcesResponse = {
      application,
      environments: environmentResults,
    };

    this.cache.set(cacheKey, response);
    return response;
  }

  private async fetchEnvironmentResources(
    application: string,
    environment: { name: string; project: string },
  ): Promise<EnvironmentResources> {
    const searchOptions = {
      projectId: environment.project,
      application,
      environment: environment.name,
    };

    const errors: string[] = [];
    const resourceGroups = await Promise.all([
      this.cloudAssetClient
        .searchResources(searchOptions)
        .catch(error => {
          const message =
            error instanceof Error ? error.message : 'Unknown error occurred';
          errors.push(`Cloud Asset search failed: ${message}`);
          this.logger.error(
            `Cloud Asset search failed for ${application}/${environment.name} in ${environment.project}: ${message}`,
          );
          return [];
        }),
      this.pubSubResourceProvider
        .searchResources(searchOptions)
        .catch(error => {
          const message =
            error instanceof Error ? error.message : 'Unknown error occurred';
          errors.push(`Pub/Sub search failed: ${message}`);
          this.logger.warn(
            `Pub/Sub search failed for ${application}/${environment.name} in ${environment.project}: ${message}`,
          );
          return [];
        }),
    ]);

    const resources = mergeResources(resourceGroups);

    return {
      name: environment.name,
      project: environment.project,
      resources,
      error: errors.length > 0 ? errors.join('; ') : undefined,
    };
  }
}
