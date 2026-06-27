import { createBackendModule } from '@backstage/backend-plugin-api';
import { authProvidersExtensionPoint } from '@backstage/plugin-auth-node';
import type {
  AuthProviderFactory,
  AuthProviderRouteHandlers,
  SignInResolver,
} from '@backstage/plugin-auth-node';
import type { AuthHandler } from '@backstage/plugin-auth-backend';
import {
  ldap,
  ldapAuthExtensionPoint,
  tokenValidatorRef,
  type TokenValidator,
} from '@immobiliarelabs/backstage-plugin-ldap-auth-backend';
import type { Request, Response } from 'express';

type LdapSignInResult = { uid: string };

/** Profile lookup — do not block login when LDAP user is not yet in the catalog. */
const ldapCatalogAuthHandler: AuthHandler<{ uid: string }> = async (
  { uid },
  ctx,
) => {
  try {
    const backstageUserData = await ctx.findCatalogUser({ entityRef: uid });
    return { profile: backstageUserData?.entity?.spec?.profile };
  } catch (error) {
    if (error instanceof Error && error.name === 'NotFoundError') {
      return { profile: { displayName: uid } };
    }
    throw error;
  }
};

/**
 * LDAP users must exist in the catalog for group membership on the auth token.
 * New users are often added to LDAP before the org provider syncs (~1 min).
 * Fallback login issues a user-only token; session refresh picks up groups after sync.
 */
const ldapCatalogSignInResolver: SignInResolver = async ({ result }, ctx) => {
  const uid = (result as LdapSignInResult).uid;
  if (!uid) {
    throw new Error('LDAP sign-in missing uid');
  }

  const entityRef = { name: uid };

  try {
    return await ctx.signInWithCatalogUser({ entityRef });
  } catch (error) {
    if (error instanceof Error && error.name === 'NotFoundError') {
      return await ctx.signInWithCatalogUser(
        { entityRef },
        { dangerousEntityRefFallback: { entityRef } },
      );
    }
    throw error;
  }
};

type LdapProviderOptions = {
  authHandler?: unknown;
  signIn?: unknown;
  resolvers?: unknown;
  tokenValidator?: TokenValidator;
};

class LdapAuthExt {
  #authHandler?: LdapProviderOptions['authHandler'];
  #resolvers?: LdapProviderOptions['resolvers'];
  #signInResolver?: LdapProviderOptions['signIn'];
  #tokenValidatorExt?: TokenValidator;

  set(opt: LdapProviderOptions) {
    this.#authHandler = opt.authHandler;
    this.#resolvers = opt.resolvers;
    this.#signInResolver = opt.signIn;
    this.#tokenValidatorExt = opt.tokenValidator;
  }

  get authHandler() {
    return this.#authHandler;
  }

  get resolvers() {
    return this.#resolvers;
  }

  get signInResolver() {
    return this.#signInResolver;
  }

  get tokenValidatorExt() {
    return this.#tokenValidatorExt;
  }
}

/**
 * Backstage registers GET and POST on /refresh; the LDAP plugin only accepts POST.
 * Cookie-based session refresh (GET) fails with "Method not allowed" without this.
 */
function wrapLdapAuthFactory(factory: AuthProviderFactory): AuthProviderFactory {
  return options => {
    const provider = factory(options) as AuthProviderRouteHandlers;
    const refresh = provider.refresh.bind(provider);

    return {
      start: provider.start?.bind(provider),
      frameHandler: provider.frameHandler?.bind(provider),
      logout: provider.logout?.bind(provider),
      refresh: async (req: Request, res: Response) => {
        if (req.method === 'GET') {
          req.method = 'POST';
          if (!req.body) {
            req.body = {};
          }
        }
        return refresh(req, res);
      },
    };
  };
}

export default createBackendModule({
  pluginId: 'auth',
  moduleId: 'ldap',
  register(reg) {
    const ldapAuthSetter = new LdapAuthExt();
    reg.registerExtensionPoint(ldapAuthExtensionPoint, ldapAuthSetter);

    reg.registerInit({
      deps: {
        providers: authProvidersExtensionPoint,
        tokenValidator: tokenValidatorRef,
      },
      async init({ providers, tokenValidator }) {
        providers.registerProvider({
          providerId: 'ldap',
          factory: wrapLdapAuthFactory(
            ldap.create({
              tokenValidator:
                ldapAuthSetter.tokenValidatorExt || tokenValidator,
              authHandler:
                ldapAuthSetter.authHandler ?? ldapCatalogAuthHandler,
              resolvers: ldapAuthSetter.resolvers,
              signIn: ldapAuthSetter.signInResolver ?? {
                resolver: ldapCatalogSignInResolver,
              },
            }),
          ),
        });
      },
    });
  },
});
