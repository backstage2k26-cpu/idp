import fs from 'fs';
import path from 'path';
import { parseAllDocuments } from 'yaml';
import { DEFAULT_NAMESPACE, Entity } from '@backstage/catalog-model';

const PERMISSION_ROLES_ANNOTATION = 'platform-portal.io/permission-roles';

export type FilePermissionGroups = {
  adminGroups: string[];
  creatorGroups: string[];
};

function groupEntityRef(name: string, namespace = DEFAULT_NAMESPACE): string {
  return `group:${namespace}/${name}`;
}

function parseRoles(annotationValue: string): Set<string> {
  return new Set(
    annotationValue
      .split(',')
      .map(role => role.trim().toLowerCase())
      .filter(Boolean),
  );
}

function groupsFromEntities(entities: Entity[]): FilePermissionGroups {
  const adminGroups: string[] = [];
  const creatorGroups: string[] = [];

  for (const entity of entities) {
    if (entity.kind !== 'Group') {
      continue;
    }

    const rolesValue = entity.metadata.annotations?.[PERMISSION_ROLES_ANNOTATION];
    if (!rolesValue) {
      continue;
    }

    const roles = parseRoles(rolesValue);
    const entityRef = groupEntityRef(
      entity.metadata.name,
      entity.metadata.namespace ?? DEFAULT_NAMESPACE,
    );

    if (roles.has('admin')) {
      adminGroups.push(entityRef);
    }
    if (roles.has('creator')) {
      creatorGroups.push(entityRef);
    }
  }

  return { adminGroups, creatorGroups };
}

function resolveRbacGroupsFilePath(): string | undefined {
  const candidates = [
    path.resolve(process.cwd(), 'catalog/org/rbac-groups.yaml'),
    path.resolve(process.cwd(), '../../catalog/org/rbac-groups.yaml'),
    path.resolve(__dirname, '../../../../catalog/org/rbac-groups.yaml'),
  ];

  return candidates.find(candidate => fs.existsSync(candidate));
}

/**
 * Loads permission roles from catalog/org/rbac-groups.yaml.
 * This file is the source of truth — LDAP sync can overwrite Group entities in the
 * catalog and strip annotations, but file-based roles still apply.
 */
export function loadRbacGroupsFromFile(): FilePermissionGroups | undefined {
  const filePath = resolveRbacGroupsFilePath();
  if (!filePath) {
    return undefined;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const documents = parseAllDocuments(content);
  const entities = documents
    .map(doc => doc.toJSON())
    .filter(
      (doc): doc is Entity =>
        doc !== null &&
        typeof doc === 'object' &&
        'kind' in doc &&
        'metadata' in doc,
    );

  return groupsFromEntities(entities);
}
