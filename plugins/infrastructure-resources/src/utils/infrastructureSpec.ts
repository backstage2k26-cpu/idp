import { Entity } from '@backstage/catalog-model';
import { InfrastructureEnvironment } from '../types';

const DEFAULT_APPLICATION_ANNOTATION = 'company.com/application';
const DEFAULT_INFRASTRUCTURE_ANNOTATION = 'company.com/infrastructure';

type EnvironmentInput = {
  name?: string;
  project?: string;
  projectId?: string;
};

const normalizeEnvironment = (
  environment: EnvironmentInput,
): InfrastructureEnvironment | undefined => {
  const name = environment.name?.trim();
  const project = (environment.projectId ?? environment.project)?.trim();

  if (!name || !project) {
    return undefined;
  }

  return { name, project };
};

const parseEnvironmentList = (
  value: unknown,
): InfrastructureEnvironment[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const environments = value
    .map(item => normalizeEnvironment(item as EnvironmentInput))
    .filter((item): item is InfrastructureEnvironment => Boolean(item));

  return environments.length > 0 ? environments : undefined;
};

const parseInfrastructureAnnotation = (
  annotationValue: string | undefined,
): InfrastructureEnvironment[] | undefined => {
  if (!annotationValue) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(annotationValue) as {
      environments?: unknown;
    };
    return parseEnvironmentList(parsed.environments);
  } catch {
    return undefined;
  }
};

const getSpecEnvironments = (
  entity: Entity,
): InfrastructureEnvironment[] | undefined => {
  const spec = entity.spec as {
    infrastructure?: { environments?: unknown };
    environments?: unknown;
  };

  return (
    parseEnvironmentList(spec.infrastructure?.environments) ??
    parseEnvironmentList(spec.environments)
  );
};

export const getInfrastructureEnvironments = (
  entity: Entity,
): InfrastructureEnvironment[] | undefined => {
  return (
    getSpecEnvironments(entity) ??
    parseInfrastructureAnnotation(
      entity.metadata.annotations?.[DEFAULT_INFRASTRUCTURE_ANNOTATION],
    )
  );
};

export const getApplicationName = (entity: Entity): string => {
  return getApplicationNames(entity)[0] ?? entity.metadata.name;
};

export const getApplicationNames = (entity: Entity): string[] => {
  const annotationApplications = parseApplicationNames(
    entity.metadata.annotations?.[DEFAULT_APPLICATION_ANNOTATION],
  );
  const spec = entity.spec as {
    infrastructure?: { applicationLabels?: unknown };
  };
  const specApplications = Array.isArray(spec.infrastructure?.applicationLabels)
    ? spec.infrastructure.applicationLabels
        .filter((value): value is string => typeof value === 'string')
        .flatMap(value => parseApplicationNames(value))
    : [];

  const applications = Array.from(
    new Set(
      annotationApplications.length > 0
        ? annotationApplications
        : specApplications.length > 0
        ? specApplications
        : [entity.metadata.name],
    ),
  );

  return applications;
};

const parseApplicationNames = (value: string | undefined): string[] => {
  if (!value) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .split(',')
        .map(name => name.trim())
        .filter(Boolean),
    ),
  );
};

export const hasInfrastructureResources = (entity: Entity): boolean => {
  const environments = getInfrastructureEnvironments(entity);
  return Boolean(environments && environments.length > 0);
};
