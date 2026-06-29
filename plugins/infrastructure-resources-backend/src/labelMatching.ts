import { LabelKeys } from './cloudAssetClient';

const normalizeLabelValue = (value: string | undefined): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const normalizeLabels = (
  labels: Record<string, string> | undefined,
): Record<string, string> => {
  if (!labels) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(labels)
      .map(([key, value]) => {
        const normalized = normalizeLabelValue(value);
        return normalized ? [key, normalized] : undefined;
      })
      .filter((entry): entry is [string, string] => Boolean(entry)),
  );
};

export const parseApplicationNames = (value: string | undefined): string[] => {
  if (!value) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .split(',')
        .map(name => normalizeLabelValue(name))
        .filter((name): name is string => Boolean(name)),
    ),
  );
};

export const matchesExpectedLabels = (
  labels: Record<string, string> | undefined,
  expected: {
    application: string;
    environment: string;
    applications?: string[];
  },
  labelKeys: LabelKeys,
): boolean => {
  const normalized = normalizeLabels(labels);
  const expectedEnvironment = normalizeLabelValue(expected.environment);
  const applicationNames =
    expected.applications && expected.applications.length > 0
      ? expected.applications
      : parseApplicationNames(expected.application);

  if (applicationNames.length === 0 || !expectedEnvironment) {
    return false;
  }

  const actualApplication = normalized[labelKeys.application];
  const actualEnvironment = normalized[labelKeys.environment];

  if (!actualApplication || !actualEnvironment) {
    return false;
  }

  return (
    applicationNames.includes(actualApplication) &&
    actualEnvironment.toLowerCase() === expectedEnvironment.toLowerCase()
  );
};

export const extractResourceName = (resourceName: string): string => {
  const segments = resourceName.split('/');
  return segments[segments.length - 1] ?? resourceName;
};

export const extractTopicLabels = (
  metadata: unknown,
): Record<string, string> | undefined => {
  if (!metadata || typeof metadata !== 'object') {
    return undefined;
  }

  const record = metadata as {
    labels?: Record<string, string>;
    metadata?: { labels?: Record<string, string> };
  };

  return record.labels ?? record.metadata?.labels;
};
