import { Entity } from '@backstage/catalog-model';
import { EntityUserFilter } from '@backstage/plugin-catalog-react';

let patched = false;

/**
 * Backstage applies the Owned filter on the server (relations.ownedBy) but also
 * re-filters client-side using entity.relations, which list responses often omit.
 * That leaves the sidebar count correct while the table shows zero rows.
 */
export function patchCatalogOwnedFilter(): void {
  if (patched) {
    return;
  }
  patched = true;

  const originalFilterEntity = EntityUserFilter.prototype.filterEntity;

  EntityUserFilter.prototype.filterEntity = function (
    this: EntityUserFilter,
    entity: Entity,
  ): boolean {
    if (this.value === 'owned') {
      return true;
    }
    return originalFilterEntity.call(this, entity);
  };
}
