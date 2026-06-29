import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { catalogServiceRef } from '@backstage/plugin-catalog-node';
import { MiddlewareFactory } from '@backstage/backend-defaults/rootHttpRouter';
import { CloudAssetClient } from './cloudAssetClient';
import { PubSubResourceProvider } from './pubsubResourceProvider';
import { InfrastructureResourcesService } from './service';
import { createRouter } from './router';

export const infrastructureResourcesPlugin = createBackendPlugin({
  pluginId: 'infrastructure-resources',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        config: coreServices.rootConfig,
        httpRouter: coreServices.httpRouter,
        httpAuth: coreServices.httpAuth,
        catalog: catalogServiceRef,
      },
      async init({ logger, config, httpRouter, httpAuth, catalog }) {
        const pluginConfig = config.getOptionalConfig(
          'infrastructureResources',
        );
        const labelKeysConfig = pluginConfig?.getOptionalConfig('labelKeys');

        const cloudAssetClient = new CloudAssetClient({
          logger,
          labelKeys: {
            application:
              labelKeysConfig?.getOptionalString('application') ?? 'app',
            environment:
              labelKeysConfig?.getOptionalString('environment') ?? 'env',
          },
        });
        const pubSubResourceProvider = new PubSubResourceProvider({
          logger,
          labelKeys: {
            application:
              labelKeysConfig?.getOptionalString('application') ?? 'app',
            environment:
              labelKeysConfig?.getOptionalString('environment') ?? 'env',
          },
        });
        const service = new InfrastructureResourcesService({
          logger,
          config,
          cloudAssetClient,
          pubSubResourceProvider,
        });

        const router = await createRouter({
          logger,
          catalog,
          httpAuth,
          service,
        });

        const middleware = MiddlewareFactory.create({ logger, config });
        router.use(middleware.error());
        httpRouter.use(router);
      },
    });
  },
});
