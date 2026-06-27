import {
  AuthService,
  LoggerService,
  SchedulerService,
} from '@backstage/backend-plugin-api';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { CatalogService } from '@backstage/plugin-catalog-node';
import { loadRbacGroupsFromFile } from './loadRbacGroupsFromFile';

/** Annotation on Group entities — comma-separated roles: admin, creator */
export const PERMISSION_ROLES_ANNOTATION =
  'platform-portal.io/permission-roles';

export type PermissionGroups = {
  adminGroups: string[];
  creatorGroups: string[];
};

const DEFAULT_GROUPS: PermissionGroups = {
  adminGroups: ['group:default/platform'],
  creatorGroups: ['group:default/platform', 'group:default/devops'],
};

function parseRoles(annotationValue: string): Set<string> {
  return new Set(
    annotationValue
      .split(',')
      .map(role => role.trim().toLowerCase())
      .filter(Boolean),
  );
}

export class CatalogPermissionGroupsResolver {
  private groups: PermissionGroups = DEFAULT_GROUPS;

  constructor(
    private readonly catalog: CatalogService,
    private readonly auth: AuthService,
    private readonly logger: LoggerService,
  ) {}

  getGroups(): PermissionGroups {
    return this.groups;
  }

  async refresh(): Promise<void> {
    try {
      const fileGroups = loadRbacGroupsFromFile();
      const adminGroups = new Set<string>(fileGroups?.adminGroups ?? []);
      const creatorGroups = new Set<string>(fileGroups?.creatorGroups ?? []);

      const credentials = await this.auth.getOwnServiceCredentials();
      const { items } = await this.catalog.getEntities(
        { filter: { kind: 'Group' } },
        { credentials },
      );

      for (const entity of items) {
        const rolesValue =
          entity.metadata.annotations?.[PERMISSION_ROLES_ANNOTATION];
        if (!rolesValue) {
          continue;
        }

        const roles = parseRoles(rolesValue);
        const entityRef = stringifyEntityRef(entity);

        if (roles.has('admin')) {
          adminGroups.add(entityRef);
        }
        if (roles.has('creator')) {
          creatorGroups.add(entityRef);
        }
      }

      if (adminGroups.size === 0 && creatorGroups.size === 0) {
        this.logger.warn(
          `No permission roles in rbac-groups.yaml or catalog; using defaults`,
        );
        this.groups = DEFAULT_GROUPS;
        return;
      }

      this.groups = {
        adminGroups: [...adminGroups],
        creatorGroups: [...creatorGroups],
      };

      const source = fileGroups
        ? 'rbac-groups.yaml + catalog annotations'
        : 'catalog annotations only';
      this.logger.info(
        `Permission groups loaded (${source}): ${adminGroups.size} admin, ${creatorGroups.size} creator`,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to load permission groups, keeping previous values: ${error}`,
      );
    }
  }

  async scheduleRefresh(scheduler: SchedulerService): Promise<void> {
    await scheduler.scheduleTask({
      id: 'platform-portal-permission-groups-refresh',
      frequency: { minutes: 1 },
      timeout: { minutes: 1 },
      fn: async () => {
        await this.refresh();
      },
    });
  }
}
