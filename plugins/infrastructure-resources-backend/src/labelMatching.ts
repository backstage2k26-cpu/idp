import { LabelKeys } from './cloudAssetClient';

export const matchesExpectedLabels = (
  labels: Record<string, string> | undefined,
  expected: { application: string; environment: string },
  labelKeys: LabelKeys,
): boolean => {
  if (!labels) {
    return false;
  }

  return (
    labels[labelKeys.application] === expected.application &&
    labels[labelKeys.environment] === expected.environment
  );
};

export const extractResourceName = (resourceName: string): string => {
  const segments = resourceName.split('/');
  return segments[segments.length - 1] ?? resourceName;
};
