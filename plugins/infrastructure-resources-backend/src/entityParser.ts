import { Entity } from '@backstage/catalog-model';
import { InputError } from '@backstage/errors';
import { InfrastructureEnvironment, ParsedInfrastructureConfig } from './types';

const DEFAULT_APPLICATION_ANNOTATION = 'company.com/application';
const DEFAULT_INFRASTRUCTURE_ANNOTATION = 'company.com/infrastructure';

type EnvironmentInput = {
  name?: string;
  project?: string;
  projectId?: string;
};

type InfrastructureConfigOptions = {
  applicationAnnotation?: string;
  infrastructureAnnotation?: string;
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

export const parseInfrastructureConfig = (
  entity: Entity,
  options: InfrastructureConfigOptions = {},
): ParsedInfrastructureConfig => {
  const applicationAnnotation =
    options.applicationAnnotation ?? DEFAULT_APPLICATION_ANNOTATION;
  const infrastructureAnnotation =
    options.infrastructureAnnotation ?? DEFAULT_INFRASTRUCTURE_ANNOTATION;

  const application =
    entity.metadata.annotations?.[applicationAnnotation]?.trim() ||
    entity.metadata.name;

  const environments =
    getSpecEnvironments(entity) ??
    parseInfrastructureAnnotation(
      entity.metadata.annotations?.[infrastructureAnnotation],
    );

  if (!environments || environments.length === 0) {
    throw new InputError(
      `Entity ${entity.metadata.name} is missing infrastructure environment configuration. Add environments under spec.infrastructure.environments or the ${infrastructureAnnotation} annotation.`,
    );
  }

  return { application, environments };
};

export const hasInfrastructureConfig = (entity: Entity): boolean => {
  try {
    parseInfrastructureConfig(entity);
    return true;
  } catch {
    return false;
  }
};
