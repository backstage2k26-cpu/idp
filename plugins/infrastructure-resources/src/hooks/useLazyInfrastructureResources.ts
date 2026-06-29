import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import { useEntity } from '@backstage/plugin-catalog-react';
import { infrastructureResourcesApiRef } from '../api';
import { EnvironmentResources } from '../types';
import {
  getApplicationNames,
  getInfrastructureEnvironments,
} from '../utils/infrastructureSpec';

type EnvironmentState = {
  loading: boolean;
  data?: EnvironmentResources;
  error?: Error;
};

export const useLazyInfrastructureResources = () => {
  const { entity } = useEntity();
  const api = useApi(infrastructureResourcesApiRef);
  const configuredEnvironments = useMemo(
    () => getInfrastructureEnvironments(entity) ?? [],
    [entity],
  );
  const applicationNames = useMemo(() => getApplicationNames(entity), [entity]);
  const applicationName = applicationNames.join(', ');
  const [refreshToken, setRefreshToken] = useState(0);
  const bypassCacheRef = useRef(false);
  const [environmentStates, setEnvironmentStates] = useState<
    Record<string, EnvironmentState>
  >({});

  useEffect(() => {
    if (configuredEnvironments.length === 0) {
      setEnvironmentStates({});
      return undefined;
    }

    let cancelled = false;
    const refresh = bypassCacheRef.current;
    bypassCacheRef.current = false;

    setEnvironmentStates(current => {
      const next: Record<string, EnvironmentState> = {};
      for (const environment of configuredEnvironments) {
        next[environment.name] = {
          loading: true,
          data: refresh ? undefined : current[environment.name]?.data,
          error: undefined,
        };
      }
      return next;
    });

    for (const environment of configuredEnvironments) {
      api
        .getEnvironmentResources({
          entity,
          environmentName: environment.name,
          refresh,
        })
        .then(data => {
          if (cancelled) {
            return;
          }
          setEnvironmentStates(current => ({
            ...current,
            [environment.name]: {
              loading: false,
              data,
              error: undefined,
            },
          }));
        })
        .catch(error => {
          if (cancelled) {
            return;
          }
          setEnvironmentStates(current => ({
            ...current,
            [environment.name]: {
              loading: false,
              data: current[environment.name]?.data,
              error:
                error instanceof Error
                  ? error
                  : new Error('Failed to load GCP resources'),
            },
          }));
        });
    }

    return () => {
      cancelled = true;
    };
  }, [api, configuredEnvironments, entity, refreshToken]);

  const environments = useMemo(
    () =>
      configuredEnvironments.map(environment => ({
        ...environment,
        state: environmentStates[environment.name] ?? { loading: true },
      })),
    [configuredEnvironments, environmentStates],
  );

  const loadedEnvironments = useMemo(
    () =>
      environments
        .map(item => item.state.data)
        .filter((item): item is EnvironmentResources => Boolean(item)),
    [environments],
  );

  const loading = environments.some(
    item => item.state.loading && !item.state.data,
  );
  const refreshing = environments.some(item => item.state.loading);
  const error = environments.find(item => item.state.error)?.state.error;

  const refresh = useCallback(() => {
    bypassCacheRef.current = true;
    setRefreshToken(current => current + 1);
  }, []);

  const retry = useCallback(() => {
    setRefreshToken(current => current + 1);
  }, []);

  return {
    applicationName,
    environments,
    loadedEnvironments,
    loading,
    refreshing,
    error,
    refresh,
    retry,
  };
};
