import express from 'express';
import Router from 'express-promise-router';
import { LoggerService } from '@backstage/backend-plugin-api';
import { CatalogService } from '@backstage/plugin-catalog-node';
import { HttpAuthService } from '@backstage/backend-plugin-api';
import { InputError, NotFoundError } from '@backstage/errors';
import { InfrastructureResourcesService } from './service';

export type RouterOptions = {
  logger: LoggerService;
  catalog: CatalogService;
  httpAuth: HttpAuthService;
  service: InfrastructureResourcesService;
};

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { catalog, httpAuth, service } = options;
  const router = Router();

  router.use(express.json());

  router.get('/entities/:kind/:namespace/:name', async (request, response) => {
    const { kind, namespace, name } = request.params;
    const refresh = request.query.refresh === 'true';

    if (kind.toLowerCase() !== 'component') {
      throw new InputError(
        'Infrastructure resources are only available for Component entities',
      );
    }

    const credentials = await httpAuth.credentials(request);
    const entity = await catalog.getEntityByRef(
      { kind, namespace, name },
      { credentials },
    );

    if (!entity) {
      throw new NotFoundError(`Entity ${kind}:${namespace}/${name} not found`);
    }

    const result = await service.getResourcesForEntity({
      entity,
      refresh,
    });

    response.json(result);
  });

  return router;
}
