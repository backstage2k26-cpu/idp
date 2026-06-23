
import React from 'react';
import { EnvLinker } from './components/toolbox/EnvLinker';
import { Navigate, Route } from 'react-router-dom';
import { apiDocsPlugin, ApiExplorerPage } from '@backstage/plugin-api-docs';
import {
  CatalogEntityPage,
  CatalogIndexPage,
  catalogPlugin,
} from '@backstage/plugin-catalog';
import {
  CatalogImportPage,
  catalogImportPlugin,
} from '@backstage/plugin-catalog-import';
import { ScaffolderPage, scaffolderPlugin } from '@backstage/plugin-scaffolder';
import { orgPlugin } from '@backstage/plugin-org';
import { SearchPage } from '@backstage/plugin-search';
import {
  TechDocsIndexPage,
  techdocsPlugin,
  TechDocsReaderPage,
} from '@backstage/plugin-techdocs';
import { TechDocsAddons } from '@backstage/plugin-techdocs-react';
import { ReportIssue } from '@backstage/plugin-techdocs-module-addons-contrib';
import { UserSettingsPage } from '@backstage/plugin-user-settings';
import { apis, kcOIDCAuthApiRef } from './apis';
import { entityPage } from './components/catalog/EntityPage';
import { searchPage } from './components/search/SearchPage';
import { Root } from './components/Root';
import { ToolboxPage } from '@drodil/backstage-plugin-toolbox';
import {
  AlertDisplay,
  OAuthRequestDialog,
  SignInPage,
} from '@backstage/core-components';
import { createApp } from '@backstage/app-defaults';
import { AppRouter, FlatRoutes } from '@backstage/core-app-api';
import { CatalogGraphPage } from '@backstage/plugin-catalog-graph';
import { RequirePermission } from '@backstage/plugin-permission-react';
import { catalogEntityCreatePermission } from '@backstage/plugin-catalog-common/alpha';
import { NotificationsPage } from '@backstage/plugin-notifications';
import { SignalsDisplay } from '@backstage/plugin-signals';
import { githubAuthApiRef} from '@backstage/core-plugin-api';
import { TechRadarPage } from '@backstage-community/plugin-tech-radar';
import { HomepageCompositionRoot } from '@backstage/plugin-home';
import { HomePage } from './components/home/HomePage';
import Brightness2Icon from '@material-ui/icons/Brightness2';
import WbSunnyIcon from '@material-ui/icons/WbSunny';
import {
  UnifiedThemeProvider,
  createUnifiedTheme,
  genPageTheme,
  pageTheme,
  palettes,
  shapes,
} from '@backstage/theme';

const blueHeaderTheme = genPageTheme({
  colors: ['#1F5493', '#0A6EBE'],
  shape: shapes.wave,
});

const bluePageTheme = Object.fromEntries(
  Object.keys(pageTheme).map(themeId => [themeId, blueHeaderTheme]),
) as typeof pageTheme;

const lightTheme = createUnifiedTheme({
  palette: palettes.light,
  pageTheme: bluePageTheme,
});

const darkTheme = createUnifiedTheme({
  palette: palettes.dark,
  pageTheme: bluePageTheme,
});

const app = createApp({
  apis,
  themes: [
    {
      id: 'light',
      title: 'Light Theme',
      variant: 'light',
      icon: <WbSunnyIcon />,
      Provider: ({ children }) => (
        <UnifiedThemeProvider theme={lightTheme}>
          {children}
        </UnifiedThemeProvider>
      ),
    },
    {
      id: 'dark',
      title: 'Dark Theme',
      variant: 'dark',
      icon: <Brightness2Icon />,
      Provider: ({ children }) => (
        <UnifiedThemeProvider theme={darkTheme}>
          {children}
        </UnifiedThemeProvider>
      ),
    },
  ],
  bindRoutes({ bind }) {
    bind(catalogPlugin.externalRoutes, {
      createComponent: scaffolderPlugin.routes.root,
      viewTechDoc: techdocsPlugin.routes.docRoot,
      createFromTemplate: scaffolderPlugin.routes.selectedTemplate,
    });
    bind(apiDocsPlugin.externalRoutes, {
      registerApi: catalogImportPlugin.routes.importPage,
    });
    bind(scaffolderPlugin.externalRoutes, {
      registerComponent: catalogImportPlugin.routes.importPage,
      viewTechDoc: techdocsPlugin.routes.docRoot,
    });
    bind(orgPlugin.externalRoutes, {
      catalogIndex: catalogPlugin.routes.catalogIndex,
    });
  },
  components: {
   SignInPage: props => <SignInPage {...props} auto providers={[
        {
            id: 'keycloak',
            title: 'Keycloak',
            message: 'Sign in using Keycloak',
            apiRef: kcOIDCAuthApiRef,
          },
        {
            id: 'github',
            title: 'GitHub',
            message: 'Sign in using GitHub',
            apiRef: githubAuthApiRef,
          },
      ]} />,
 }})
const AppRoutes = () => (
  <FlatRoutes>
    // ...
    // ...
  </FlatRoutes>
);

const routes = (
  <FlatRoutes>
    <Route
      path="/toolbox"
      element={
        <ToolboxPage
          extraTools={[
            // {
            //   id: 'secret-scrubber',
            //   name: 'Secret Scrubber',
            //   component: <SecretScrubber />,
            //   description: 'Masks API keys from logs',
            //   category: 'Security',
            // },
            {
              id: 'env-linker',
              name: 'Environment Linker',
              component: <EnvLinker />,
              description: 'Deep links to Splunk and Datadog',
              category: 'Platform Engineering',
            },
          ]}
        />
      }
    />
    <Route path="/" element={<Navigate to="home" />} />
    <Route path="/catalog" element={<CatalogIndexPage />} />
    <Route path="/home" element={<HomepageCompositionRoot />}>
      <HomePage />
    </Route>
    <Route
      path="/catalog/:namespace/:kind/:name"
      element={<CatalogEntityPage />}
    >
      {entityPage}
    </Route>
    <Route path="/docs" element={<TechDocsIndexPage />} />
    <Route
      path="/docs/:namespace/:kind/:name/*"
      element={<TechDocsReaderPage />}
    >
      <TechDocsAddons>
        <ReportIssue />
      </TechDocsAddons>
    </Route>
    <Route path="/create" element={<ScaffolderPage />} />
    <Route path="/api-docs" element={<ApiExplorerPage />} />
    <Route
      path="/catalog-import"
      element={
        <RequirePermission permission={catalogEntityCreatePermission}>
          <CatalogImportPage />
        </RequirePermission>
      }
    />
    <Route path="/search" element={<SearchPage />}>
      {searchPage}
    </Route>
    <Route path="/settings" element={<UserSettingsPage />} />
    <Route path="/catalog-graph" element={<CatalogGraphPage />} />
    <Route path="/notifications" element={<NotificationsPage />} />
    <Route
      path="/tech-radar"
      element={<TechRadarPage />}
    />
    <Route path="/toolbox" element={<ToolboxPage />} />
  </FlatRoutes>
);

export default app.createRoot(
  <>
    <AlertDisplay />
    <OAuthRequestDialog />
    <SignalsDisplay />
    <AppRouter>
      <Root>{routes}</Root>
    </AppRouter>
  </>,
);
 