import { useCallback, useRef, useState } from 'react';
import useAsync from 'react-use/esm/useAsync';
import { useApi } from '@backstage/core-plugin-api';
import { useEntity } from '@backstage/plugin-catalog-react';
import { infrastructureResourcesApiRef } from '../api';

export const useInfrastructureResources = () => {
  const { entity } = useEntity();
  const api = useApi(infrastructureResourcesApiRef);
  const [refreshToken, setRefreshToken] = useState(0);
  const bypassCacheRef = useRef(false);

  const { value, loading, error, retry } = useAsync(async () => {
    const refresh = bypassCacheRef.current;
    bypassCacheRef.current = false;

    return api.getResources({
      entity,
      refresh,
    });
  }, [api, entity, refreshToken]);

  const refresh = useCallback(() => {
    bypassCacheRef.current = true;
    setRefreshToken(current => current + 1);
  }, []);

  return {
    data: value,
    loading,
    error,
    retry,
    refresh,
  };
};
