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
  return (
    entity.metadata.annotations?.[DEFAULT_APPLICATION_ANNOTATION]?.trim() ||
    entity.metadata.name
  );
};

export const hasInfrastructureResources = (entity: Entity): boolean => {
  const environments = getInfrastructureEnvironments(entity);
  return Boolean(environments && environments.length > 0);
};
