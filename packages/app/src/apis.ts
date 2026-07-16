import {
  ScmIntegrationsApi,
  scmIntegrationsApiRef,
  ScmAuth,
} from '@backstage/integration-react';
import {
  AnyApiFactory,
  configApiRef,
  createApiFactory,
  discoveryApiRef,
  fetchApiRef,
  identityApiRef,
} from '@backstage/core-plugin-api';
import {
  githubAuthApiRef,
} from '@backstage/core-plugin-api';
import {
  DoraMetricsClient,
  doraMetricsApiRef,
} from '@c2l2c/backstage-plugin-dora-metrics';
import {
  TechRadarApi,
  techRadarApiRef,
} from '@backstage-community/plugin-tech-radar';
import { TechRadarLoaderResponse } from '@backstage-community/plugin-tech-radar-common';
import { data } from './TechRadarJson';
import {
  ApiRef,
  BackstageIdentityApi,
  createApiRef,
  oauthRequestApiRef,
  OpenIdConnectApi,
  ProfileInfoApi,
  SessionApi,
} from '@backstage/core-plugin-api';
import { OAuth2 } from '@backstage/core-app-api';
import { sonarQubeApiRef } from '@backstage-community/plugin-sonarqube-react';
import { SonarQubeClient } from '@backstage-community/plugin-sonarqube';
import {
  argoCDApiRef,
  ArgoCDApiClient,
} from '@roadiehq/backstage-plugin-argo-cd';

// Keycloak
export const kcOIDCAuthApiRef: ApiRef<
  OpenIdConnectApi & ProfileInfoApi & BackstageIdentityApi & SessionApi
> = createApiRef({
  id: 'auth.keycloak',
});

export class MyOwnClient implements TechRadarApi {
  async load(): Promise<TechRadarLoaderResponse> {
    return data;
  }
}

// export const apis: AnyApiFactory[] = [
//   createApiFactory({
//     api: scmIntegrationsApiRef,
//     deps: { configApi: configApiRef },
//     factory: ({ configApi }) => ScmIntegrationsApi.fromConfig(configApi),
//   }),
//   ScmAuth.createDefaultApiFactory(),
//   createApiFactory(techRadarApiRef, new MyOwnClient()),

// ];

export const apis: AnyApiFactory[] = [
  createApiFactory({
    api: kcOIDCAuthApiRef,
    deps: {
      discoveryApi: discoveryApiRef,
      oauthRequestApi: oauthRequestApiRef,
      configApi: configApiRef,
    },
    factory: ({ discoveryApi, oauthRequestApi, configApi }) =>
      OAuth2.create({
        configApi,
        discoveryApi,
        oauthRequestApi,
        provider: {
          id: 'keycloak',
          title: 'Log in with keycloak',
          icon: () => null,
        },
        environment: configApi.getOptionalString('auth.environment'),
        defaultScopes: ['openid', 'profile', 'email'],

        popupOptions: {
          // optional, used to customize login in popup size
          size: {
            width: 600,
            height: 735,
          },
        },
      }),
  }),

  createApiFactory({
    api: scmIntegrationsApiRef,
    deps: { configApi: configApiRef },
    factory: ({ configApi }) => ScmIntegrationsApi.fromConfig(configApi),
  }),
  ScmAuth.createDefaultApiFactory(),
  createApiFactory(techRadarApiRef, new MyOwnClient()),
  createApiFactory({
    api: sonarQubeApiRef,
    deps: {
      discoveryApi: discoveryApiRef,
      fetchApi: fetchApiRef,
    },
    factory: ({ discoveryApi, fetchApi }) =>
      new SonarQubeClient({ discoveryApi, fetchApi }),
  }),
  createApiFactory({
    api: argoCDApiRef,
    deps: {
      discoveryApi: discoveryApiRef,
      identityApi: identityApiRef,
      configApi: configApiRef,
    },
    factory: ({ discoveryApi, identityApi, configApi }) =>
      new ArgoCDApiClient({
        discoveryApi,
        identityApi,
        backendBaseUrl: configApi.getString('backend.baseUrl'),
        useNamespacedApps: Boolean(
          configApi.getOptionalBoolean('argocd.namespacedApps'),
        ),
        searchInstances: Boolean(
          configApi.getOptionalConfigArray('argocd.appLocatorMethods')?.length,
        ),
      }),
  }),
  createApiFactory({
  api: doraMetricsApiRef,
  deps: {
    githubAuthApi: githubAuthApiRef,
    configApi: configApiRef,
  },
  factory: ({ githubAuthApi, configApi }) =>
    new DoraMetricsClient(
      githubAuthApi,
      configApi,
    ),
}),
];
