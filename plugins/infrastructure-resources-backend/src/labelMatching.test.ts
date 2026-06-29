import { LabelKeys } from './cloudAssetClient';
import {
  matchesExpectedLabels,
  normalizeLabels,
  parseApplicationNames,
} from './labelMatching';

describe('labelMatching', () => {
  const labelKeys: LabelKeys = {
    application: 'app',
    environment: 'env',
  };

  it('matches labels with trimmed values and case-insensitive environment', () => {
    expect(
      matchesExpectedLabels(
        { app: ' order-test ', env: 'Dev' },
        { application: 'order-test', environment: 'dev' },
        labelKeys,
      ),
    ).toBe(true);
  });

  it('matches when any configured application label is present', () => {
    expect(
      matchesExpectedLabels(
        { app: 'payment-service', env: 'dev' },
        {
          application: 'order-test',
          applications: ['order-test', 'payment-service'],
          environment: 'dev',
        },
        labelKeys,
      ),
    ).toBe(true);
  });

  it('parses comma-separated application names', () => {
    expect(parseApplicationNames('order-test, payment-service')).toEqual([
      'order-test',
      'payment-service',
    ]);
  });
});
