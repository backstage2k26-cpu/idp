import { Config } from '@backstage/config';
import { Entity } from '@backstage/catalog-model';
import { LoggerService } from '@backstage/backend-plugin-api';
import { InputError } from '@backstage/errors';
import { CloudAssetClient } from './cloudAssetClient';
import { PubSubResourceProvider } from './pubsubResourceProvider';
import { parseInfrastructureConfig } from './entityParser';
import { mergeResources } from './resourceMerge';
import { TtlCache } from './cache';
import { EnvironmentResources, InfrastructureResourcesResponse } from './types';

const DEFAULT_CACHE_TTL_MINUTES = 15;

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
  private readonly entityCache: TtlCache<InfrastructureResourcesResponse>;
  private readonly environmentCache: TtlCache<EnvironmentResources>;
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
    this.entityCache = new TtlCache(cacheTtlMinutes * 60 * 1000);
    this.environmentCache = new TtlCache(cacheTtlMinutes * 60 * 1000);
    this.applicationAnnotation = pluginConfig?.getOptionalString(
      'applicationAnnotation',
    );
    this.infrastructureAnnotation = pluginConfig?.getOptionalString(
      'infrastructureAnnotation',
    );
  }

  private getEntityCacheKey(entity: Entity): string {
    return `${entity.kind}:${entity.metadata.namespace ?? 'default'}/${
      entity.metadata.name
    }`;
  }

  private getEnvironmentCacheKey(
    entity: Entity,
    environmentName: string,
  ): string {
    return `${this.getEntityCacheKey(entity)}:${environmentName}`;
  }

  async getResourcesForEntity(options: {
    entity: Entity;
    refresh?: boolean;
  }): Promise<InfrastructureResourcesResponse> {
    const { entity, refresh = false } = options;
    const cacheKey = this.getEntityCacheKey(entity);

    if (!refresh) {
      const cached = this.entityCache.get(cacheKey);
      if (cached) {
        return cached;
      }
    } else {
      this.entityCache.delete(cacheKey);
      this.clearEnvironmentCache(entity);
    }

    const { application, applications, environments } =
      parseInfrastructureConfig(entity, {
        applicationAnnotation: this.applicationAnnotation,
        infrastructureAnnotation: this.infrastructureAnnotation,
      });

    const environmentResults = await Promise.all(
      environments.map(environment =>
        this.fetchEnvironmentResources(application, applications, environment, {
          entity,
          refresh,
        }),
      ),
    );

    const response: InfrastructureResourcesResponse = {
      application,
      environments: environmentResults,
    };

    this.entityCache.set(cacheKey, response);
    return response;
  }

  async getResourcesForEnvironment(options: {
    entity: Entity;
    environmentName: string;
    refresh?: boolean;
  }): Promise<EnvironmentResources> {
    const { entity, environmentName, refresh = false } = options;
    const cacheKey = this.getEnvironmentCacheKey(entity, environmentName);

    if (!refresh) {
      const cached = this.environmentCache.get(cacheKey);
      if (cached) {
        return cached;
      }
    } else {
      this.environmentCache.delete(cacheKey);
      this.entityCache.delete(this.getEntityCacheKey(entity));
    }

    const { application, applications, environments } =
      parseInfrastructureConfig(entity, {
        applicationAnnotation: this.applicationAnnotation,
        infrastructureAnnotation: this.infrastructureAnnotation,
      });

    const environment = environments.find(
      item => item.name === environmentName,
    );
    if (!environment) {
      throw new InputError(
        `Environment "${environmentName}" is not configured for entity ${entity.metadata.name}`,
      );
    }

    const result = await this.fetchEnvironmentResources(
      application,
      applications,
      environment,
      {
        entity,
        refresh,
      },
    );

    this.environmentCache.set(cacheKey, result);
    return result;
  }

  private clearEnvironmentCache(entity: Entity): void {
    const { environments } = parseInfrastructureConfig(entity, {
      applicationAnnotation: this.applicationAnnotation,
      infrastructureAnnotation: this.infrastructureAnnotation,
    });

    for (const environment of environments) {
      this.environmentCache.delete(
        this.getEnvironmentCacheKey(entity, environment.name),
      );
    }
  }

  private async fetchEnvironmentResources(
    application: string,
    applications: string[],
    environment: { name: string; project: string },
    options: { entity: Entity; refresh?: boolean },
  ): Promise<EnvironmentResources> {
    const cacheKey = this.getEnvironmentCacheKey(
      options.entity,
      environment.name,
    );

    if (!options.refresh) {
      const cached = this.environmentCache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const searchOptions = {
      projectId: environment.project,
      application,
      applications,
      environment: environment.name,
    };

    const errors: string[] = [];

    const [cloudAssetResources, pubSubResources] = await Promise.all([
      this.cloudAssetClient.searchResources(searchOptions).catch(error => {
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

    const resources = mergeResources([cloudAssetResources, pubSubResources]);
    const result: EnvironmentResources = {
      name: environment.name,
      project: environment.project,
      resources,
      error: errors.length > 0 ? errors.join('; ') : undefined,
    };

    this.environmentCache.set(cacheKey, result);
    return result;
  }
}
