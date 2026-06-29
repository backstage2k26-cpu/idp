import {
  createApiRef,
  DiscoveryApi,
  FetchApi,
} from '@backstage/core-plugin-api';
import { Entity } from '@backstage/catalog-model';
import {
  EnvironmentResources,
  InfrastructureResourcesResponse,
} from '../types';

export const infrastructureResourcesApiRef =
  createApiRef<InfrastructureResourcesApi>({
    id: 'plugin.infrastructure-resources.service',
  });

export interface InfrastructureResourcesApi {
  getResources(options: {
    entity: Entity;
    refresh?: boolean;
  }): Promise<InfrastructureResourcesResponse>;
  getEnvironmentResources(options: {
    entity: Entity;
    environmentName: string;
    refresh?: boolean;
  }): Promise<EnvironmentResources>;
}

export class InfrastructureResourcesClient
  implements InfrastructureResourcesApi
{
  private readonly discoveryApi: DiscoveryApi;
  private readonly fetchApi: FetchApi;

  constructor(options: { discoveryApi: DiscoveryApi; fetchApi: FetchApi }) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
  }

  async getResources(options: {
    entity: Entity;
    refresh?: boolean;
  }): Promise<InfrastructureResourcesResponse> {
    const { entity, refresh = false } = options;
    const baseUrl = await this.discoveryApi.getBaseUrl(
      'infrastructure-resources',
    );
    const namespace = entity.metadata.namespace ?? 'default';
    const query = refresh ? '?refresh=true' : '';
    const url = `${baseUrl}/entities/${entity.kind}/${namespace}/${entity.metadata.name}${query}`;

    const response = await this.fetchApi.fetch(url);

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        body || `Failed to fetch GCP resources (${response.status})`,
      );
    }

    return response.json();
  }

  async getEnvironmentResources(options: {
    entity: Entity;
    environmentName: string;
    refresh?: boolean;
  }): Promise<EnvironmentResources> {
    const { entity, environmentName, refresh = false } = options;
    const baseUrl = await this.discoveryApi.getBaseUrl(
      'infrastructure-resources',
    );
    const namespace = entity.metadata.namespace ?? 'default';
    const query = refresh ? '?refresh=true' : '';
    const url = `${baseUrl}/entities/${entity.kind}/${namespace}/${
      entity.metadata.name
    }/environments/${encodeURIComponent(environmentName)}${query}`;

    const response = await this.fetchApi.fetch(url);

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        body ||
          `Failed to fetch GCP resources for ${environmentName} (${response.status})`,
      );
    }

    return response.json();
  }
}
