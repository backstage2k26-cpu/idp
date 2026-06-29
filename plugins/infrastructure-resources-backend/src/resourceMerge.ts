import { InfrastructureResource } from './types';

const resourceKey = (resource: InfrastructureResource): string =>
  `${resource.assetType ?? resource.type}:${resource.name}`;

export const mergeResources = (
  resourceGroups: InfrastructureResource[][],
): InfrastructureResource[] => {
  const resourcesByKey = new Map<string, InfrastructureResource>();

  for (const resources of resourceGroups) {
    for (const resource of resources) {
      resourcesByKey.set(resourceKey(resource), resource);
    }
  }

  return Array.from(resourcesByKey.values()).sort((left, right) => {
    const typeCompare = left.type.localeCompare(right.type);
    if (typeCompare !== 0) {
      return typeCompare;
    }
    return left.name.localeCompare(right.name);
  });
};
