import {
  AuthService,
  LoggerService,
  SchedulerService,
} from '@backstage/backend-plugin-api';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { CatalogService } from '@backstage/plugin-catalog-node';

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
      const credentials = await this.auth.getOwnServiceCredentials();
      const { items } = await this.catalog.getEntities(
        { filter: { kind: 'Group' } },
        { credentials },
      );

      const adminGroups: string[] = [];
      const creatorGroups: string[] = [];

      for (const entity of items) {
        const rolesValue =
          entity.metadata.annotations?.[PERMISSION_ROLES_ANNOTATION];
        if (!rolesValue) {
          continue;
        }

        const roles = parseRoles(rolesValue);
        const entityRef = stringifyEntityRef(entity);

        if (roles.has('admin')) {
          adminGroups.push(entityRef);
        }
        if (roles.has('creator')) {
          creatorGroups.push(entityRef);
        }
      }

      if (adminGroups.length === 0 && creatorGroups.length === 0) {
        this.logger.warn(
          `No catalog Group entities found with ${PERMISSION_ROLES_ANNOTATION}; using defaults`,
        );
        this.groups = DEFAULT_GROUPS;
        return;
      }

      this.groups = { adminGroups, creatorGroups };
      this.logger.info(
        `Permission groups loaded from catalog: ${adminGroups.length} admin, ${creatorGroups.length} creator`,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to load permission groups from catalog, keeping previous values: ${error}`,
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
