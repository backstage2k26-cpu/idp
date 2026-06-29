import { Entity } from '@backstage/catalog-model';
import { InputError } from '@backstage/errors';
import { InfrastructureEnvironment, ParsedInfrastructureConfig } from './types';
import { parseApplicationNames } from './labelMatching';

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

const getSpecApplications = (entity: Entity): string[] => {
  const spec = entity.spec as {
    infrastructure?: { applicationLabels?: unknown };
  };

  const labels = spec.infrastructure?.applicationLabels;
  if (!Array.isArray(labels)) {
    return [];
  }

  return Array.from(
    new Set(
      labels
        .filter((value): value is string => typeof value === 'string')
        .flatMap(value => parseApplicationNames(value)),
    ),
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

  const annotationApplications = parseApplicationNames(
    entity.metadata.annotations?.[applicationAnnotation],
  );
  const specApplications = getSpecApplications(entity);
  const applications = Array.from(
    new Set(
      annotationApplications.length > 0
        ? annotationApplications
        : specApplications.length > 0
        ? specApplications
        : [entity.metadata.name],
    ),
  );
  const application = applications[0] ?? entity.metadata.name;

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

  return { application, applications, environments };
};

export const hasInfrastructureConfig = (entity: Entity): boolean => {
  try {
    parseInfrastructureConfig(entity);
    return true;
  } catch {
    return false;
  }
};
