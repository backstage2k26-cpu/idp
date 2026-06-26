import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import {
  AuthorizeResult,
  PolicyDecision,
  isPermission,
  isResourcePermission,
} from '@backstage/plugin-permission-common';
import {
  catalogConditions,
  createCatalogConditionalDecision,
} from '@backstage/plugin-catalog-backend/alpha';
import {
  catalogEntityCreatePermission,
  catalogEntityDeletePermission,
  catalogEntityReadPermission,
  catalogEntityRefreshPermission,
  catalogLocationAnalyzePermission,
  catalogLocationCreatePermission,
} from '@backstage/plugin-catalog-common/alpha';
import {
  actionExecutePermission,
  taskCreatePermission,
  taskReadPermission,
  templateParameterReadPermission,
  templateStepReadPermission,
} from '@backstage/plugin-scaffolder-common/alpha';
import { catalogServiceRef } from '@backstage/plugin-catalog-node';
import {
  PermissionPolicy,
  PolicyQuery,
  PolicyQueryUser,
} from '@backstage/plugin-permission-node';
import { policyExtensionPoint } from '@backstage/plugin-permission-node/alpha';
import { CatalogPermissionGroupsResolver } from './catalogPermissionGroupsResolver';

function isMemberOf(
  user: PolicyQueryUser | undefined,
  entityRef: string,
): boolean {
  return user?.info.ownershipEntityRefs?.includes(entityRef) ?? false;
}

/**
 * Permission policy driven by Group annotations in the catalog.
 * Add or update groups in catalog/org/rbac-groups.yaml (or LDAP-synced groups
 * with the same annotation) — no app-config changes needed.
 */
class PlatformPortalPermissionPolicy implements PermissionPolicy {
  constructor(
    private readonly groupsResolver: CatalogPermissionGroupsResolver,
  ) {}

  private isPlatformAdmin(user?: PolicyQueryUser): boolean {
    const { adminGroups } = this.groupsResolver.getGroups();
    return adminGroups.some(group => isMemberOf(user, group));
  }

  private isComponentCreator(user?: PolicyQueryUser): boolean {
    const { creatorGroups } = this.groupsResolver.getGroups();
    return creatorGroups.some(group => isMemberOf(user, group));
  }

  async handle(
    request: PolicyQuery,
    user?: PolicyQueryUser,
  ): Promise<PolicyDecision> {
    if (this.isPlatformAdmin(user)) {
      return { result: AuthorizeResult.ALLOW };
    }

    if (isPermission(request.permission, catalogEntityReadPermission)) {
      return { result: AuthorizeResult.ALLOW };
    }

    if (
      isPermission(request.permission, templateParameterReadPermission) ||
      isPermission(request.permission, templateStepReadPermission)
    ) {
      return { result: AuthorizeResult.ALLOW };
    }

    if (
      isPermission(request.permission, catalogEntityCreatePermission) ||
      isPermission(request.permission, taskCreatePermission) ||
      isPermission(request.permission, actionExecutePermission) ||
      isPermission(request.permission, catalogLocationCreatePermission) ||
      isPermission(request.permission, catalogLocationAnalyzePermission) ||
      isPermission(request.permission, taskReadPermission)
    ) {
      return this.isComponentCreator(user)
        ? { result: AuthorizeResult.ALLOW }
        : { result: AuthorizeResult.DENY };
    }

    if (
      isPermission(request.permission, catalogEntityDeletePermission) ||
      isPermission(request.permission, catalogEntityRefreshPermission)
    ) {
      return createCatalogConditionalDecision(
        request.permission,
        catalogConditions.isEntityOwner({
          claims: user?.info.ownershipEntityRefs ?? [],
        }),
      );
    }

    if (isResourcePermission(request.permission, 'catalog-entity')) {
      return createCatalogConditionalDecision(
        request.permission,
        catalogConditions.isEntityOwner({
          claims: user?.info.ownershipEntityRefs ?? [],
        }),
      );
    }

    return { result: AuthorizeResult.DENY };
  }
}

export default createBackendModule({
  pluginId: 'permission',
  moduleId: 'platform-portal-permission-policy',
  register(reg) {
    reg.registerInit({
      deps: {
        policy: policyExtensionPoint,
        catalog: catalogServiceRef,
        auth: coreServices.auth,
        logger: coreServices.logger,
        scheduler: coreServices.scheduler,
      },
      async init({ policy, catalog, auth, logger, scheduler }) {
        const groupsResolver = new CatalogPermissionGroupsResolver(
          catalog,
          auth,
          logger,
        );

        await groupsResolver.refresh();
        await groupsResolver.scheduleRefresh(scheduler);

        policy.setPolicy(new PlatformPortalPermissionPolicy(groupsResolver));
      },
    });
  },
});
