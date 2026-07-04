import {
  catalogApiRef,
  EntityDisplayName,
  entityRouteRef,
  entityRouteParams,
  useStarredEntities,
} from '@backstage/plugin-catalog-react';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { useApi, useRouteRef } from '@backstage/core-plugin-api';
import {
  Progress,
  ResponseErrorPanel,
  FavoriteToggle,
} from '@backstage/core-components';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Link } from 'react-router-dom';
import useAsync from 'react-use/esm/useAsync';
import { GSPANN_COLORS, HOME_WIDGET_THEME } from '../../theme/gspannBrand';

const useStyles = makeStyles(theme => ({
  list: {
    padding: 0,
  },
  item: {
    borderRadius: theme.spacing(1),
    marginBottom: theme.spacing(0.5),
    paddingTop: theme.spacing(0.75),
    paddingBottom: theme.spacing(0.75),
    transition: 'background-color 0.15s ease',
    '&:hover': {
      backgroundColor: HOME_WIDGET_THEME.listHover,
    },
  },
  icon: {
    minWidth: 36,
  },
  primary: {
    color: GSPANN_COLORS.textPrimary,
    fontWeight: 500,
    fontSize: '0.9375rem',
  },
  secondary: {
    color: GSPANN_COLORS.textSecondary,
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  empty: {
    color: GSPANN_COLORS.textSecondary,
    fontSize: '0.875rem',
    lineHeight: 1.5,
  },
}));

export const HomeStarredEntitiesWidget = () => {
  const classes = useStyles();
  const catalogApi = useApi(catalogApiRef);
  const catalogEntityRoute = useRouteRef(entityRouteRef);
  const { starredEntities, toggleStarredEntity } = useStarredEntities();

  const entities = useAsync(async () => {
    if (!starredEntities.size) {
      return [];
    }
    return (
      await catalogApi.getEntitiesByRefs({
        entityRefs: [...starredEntities],
        fields: [
          'kind',
          'metadata.namespace',
          'metadata.name',
          'spec.type',
          'metadata.title',
          'spec.profile.displayName',
        ],
      })
    ).items.filter(Boolean);
  }, [catalogApi, starredEntities]);

  if (starredEntities.size === 0) {
    return (
      <Typography className={classes.empty}>
        Star entities in the catalog to see them here.
      </Typography>
    );
  }

  if (entities.loading) {
    return <Progress />;
  }

  if (entities.error) {
    return <ResponseErrorPanel error={entities.error} />;
  }

  return (
    <List className={classes.list} disablePadding>
      {entities.value
        ?.slice()
        .sort((a, b) =>
          (a!.metadata.title ?? a!.metadata.name).localeCompare(
            b!.metadata.title ?? b!.metadata.name,
          ),
        )
        .map(entity => {
          if (!entity) {
            return null;
          }

          let secondary = entity.kind.toLowerCase();
          if (entity.spec && 'type' in entity.spec && entity.spec.type) {
            secondary += ` — ${String(entity.spec.type).toLowerCase()}`;
          }

          return (
            <ListItem
              key={stringifyEntityRef(entity)}
              className={classes.item}
              component={Link}
              button
              to={catalogEntityRoute(entityRouteParams(entity))}
            >
              <ListItemIcon
                className={classes.icon}
                onClick={event => event.preventDefault()}
              >
                <FavoriteToggle
                  id={`home-star-${entity.metadata.uid}`}
                  title="Remove from starred"
                  isFavorite
                  onToggle={() => toggleStarredEntity(entity)}
                />
              </ListItemIcon>
              <ListItemText
                primary={<EntityDisplayName hideIcon entityRef={entity} />}
                secondary={secondary}
                primaryTypographyProps={{ className: classes.primary }}
                secondaryTypographyProps={{ className: classes.secondary }}
              />
            </ListItem>
          );
        })}
    </List>
  );
};
