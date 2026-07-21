import { createDevApp } from '@backstage/dev-utils';
import { devlakeDoraPlugin, DevlakeDoraPage } from '../src/plugin';

createDevApp()
  .registerPlugin(devlakeDoraPlugin)
  .addPage({
    element: <DevlakeDoraPage />,
    title: 'Root Page',
    path: '/devlake-dora',
  })
  .render();
