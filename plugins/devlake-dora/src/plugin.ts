import {
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const devlakeDoraPlugin = createPlugin({
  id: 'devlake-dora',
  routes: {
    root: rootRouteRef,
  },
});

export const DevlakeDoraPage = devlakeDoraPlugin.provide(
  createRoutableExtension({
    name: 'DevlakeDoraPage',
    component: () =>
      import('./components/ExampleComponent').then(m => m.ExampleComponent),
    mountPoint: rootRouteRef,
  }),
);
