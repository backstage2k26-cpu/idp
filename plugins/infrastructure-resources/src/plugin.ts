import {
  createPlugin,
  createApiFactory,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';
import {
  InfrastructureResourcesClient,
  infrastructureResourcesApiRef,
} from './api';

export const infrastructureResourcesPlugin = createPlugin({
  id: 'infrastructure-resources',
  apis: [
    createApiFactory({
      api: infrastructureResourcesApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
      },
      factory: ({ discoveryApi, fetchApi }) =>
        new InfrastructureResourcesClient({ discoveryApi, fetchApi }),
    }),
  ],
});
