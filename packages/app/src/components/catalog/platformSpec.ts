import { Entity } from '@backstage/catalog-model';

export type PlatformSpec = Record<string, string | number | boolean>;

const PLATFORM_FIELD_LABELS: Record<string, string> = {
  jiraId: 'JIRA ID',
  setupApproved: 'Setup Approved',
  businessUnit: 'Business Unit',
  appId: 'App ID',
  supportTeam: 'Support Team',
  tier: 'Tier',
  environment: 'Environment',
  criticality: 'Criticality',
};

const PLATFORM_FIELD_ORDER = [
  'appId',
  'jiraId',
  'businessUnit',
  'supportTeam',
];

export const getPlatformSpec = (entity: Entity): PlatformSpec | undefined => {
  const platform = (entity.spec as { platform?: PlatformSpec }).platform;

  if (!platform || typeof platform !== 'object' || Array.isArray(platform)) {
    return undefined;
  }

  const entries = Object.entries(platform).filter(
    ([, value]) =>
      value !== undefined &&
      value !== null &&
      value !== '' &&
      (typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'),
  );

  if (entries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(entries) as PlatformSpec;
};

export const hasPlatformInfo = (entity: Entity) =>
  Boolean(getPlatformSpec(entity));

const humanizeFieldName = (fieldName: string) =>
  fieldName
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase());

export const getPlatformFieldLabel = (fieldName: string) =>
  PLATFORM_FIELD_LABELS[fieldName] ?? humanizeFieldName(fieldName);

export const getOrderedPlatformFields = (platform: PlatformSpec) => {
  const knownFields = PLATFORM_FIELD_ORDER.filter(field => field in platform).map(
    field => [field, platform[field]] as const,
  );

  const additionalFields = Object.entries(platform)
    .filter(([field]) => !PLATFORM_FIELD_ORDER.includes(field))
    .sort(([leftField], [rightField]) => leftField.localeCompare(rightField));

  return [...knownFields, ...additionalFields];
};

export const formatPlatformFieldValue = (value: string | number | boolean) => {
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  return String(value);
};
