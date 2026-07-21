import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './router';

export const devlakeDoraPlugin = createBackendPlugin({
  pluginId: 'devlake-dora',
  register(env) {
    env.registerInit({
      deps: {
        httpRouter: coreServices.httpRouter,
      },
      async init({ httpRouter }) {
        httpRouter.addAuthPolicy({
          path: '/dora/:repo',
          allow: 'unauthenticated',
        });
        httpRouter.addAuthPolicy({
          path: '/db-test',
          allow: 'unauthenticated',
        });
        httpRouter.use(await createRouter());
      },
    });
  },
});