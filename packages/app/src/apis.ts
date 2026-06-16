import {
  ScmIntegrationsApi,
  scmIntegrationsApiRef,
  ScmAuth,
} from '@backstage/integration-react';
import {
  AnyApiFactory,
  configApiRef,
  createApiFactory,
} from '@backstage/core-plugin-api';
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
  discoveryApiRef,
  oauthRequestApiRef,
  OpenIdConnectApi,
  ProfileInfoApi,
  SessionApi,
} from '@backstage/core-plugin-api';
import { OAuth2 } from '@backstage/core-app-api';

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
];
