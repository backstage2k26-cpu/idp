import React from 'react';
import { Box, Button, Chip, makeStyles } from '@material-ui/core';
import GitHubIcon from '@material-ui/icons/GitHub';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import {
  ANNOTATION_LOCATION,
  ANNOTATION_SOURCE_LOCATION,
} from '@backstage/catalog-model';
import {
  MissingAnnotationEmptyState,
  useEntity,
} from '@backstage/plugin-catalog-react';
import {
  GITHUB_ACTIONS_ANNOTATION,
  isGithubActionsAvailable,
} from '@backstage-community/plugin-github-actions';

import { TabPageHeader } from '../common/TabPageHeader';
import { GSPANN_COLORS } from '../../theme/gspannBrand';

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(3, 3, 0),
    maxWidth: 1200,
  },
  metaChip: {
    fontWeight: 500,
  },
  headerButtonOutlined: {
    borderColor: GSPANN_COLORS.navy,
    color: GSPANN_COLORS.navy,
    fontWeight: 600,
    backgroundColor: '#ffffff',
    '&:hover': {
      borderColor: GSPANN_COLORS.burgundy,
      backgroundColor: GSPANN_COLORS.burgundyMuted,
    },
  },
}));

const getGithubHostFromEntity = (
  entity: ReturnType<typeof useEntity>['entity'],
) => {
  const location =
    entity.metadata.annotations?.[ANNOTATION_SOURCE_LOCATION] ??
    entity.metadata.annotations?.[ANNOTATION_LOCATION];

  if (location?.startsWith('url:')) {
    try {
      return new URL(location.slice(4)).hostname || 'github.com';
    } catch {
      return 'github.com';
    }
  }

  return 'github.com';
};

export const EntityGithubActionsHeader = () => {
  const classes = useStyles();
  const { entity } = useEntity();
  const projectSlug =
    entity.metadata.annotations?.[GITHUB_ACTIONS_ANNOTATION] ?? '';

  if (!isGithubActionsAvailable(entity)) {
    return (
      <MissingAnnotationEmptyState annotation={GITHUB_ACTIONS_ANNOTATION} />
    );
  }

  const githubHost = getGithubHostFromEntity(entity);
  const actionsUrl = `https://${githubHost}/${projectSlug}/actions`;

  return (
    <Box className={classes.root}>
      <TabPageHeader
        title={projectSlug}
        subtitle="CI/CD workflow runs powered by GitHub Actions"
        icon={<GitHubIcon style={{ color: '#24292F', fontSize: 36 }} />}
        accent="github-actions"
        chips={
          <Chip
            size="small"
            label={`${githubHost}/${projectSlug}`}
            className={classes.metaChip}
          />
        }
        actions={
          <Button
            variant="outlined"
            className={classes.headerButtonOutlined}
            startIcon={<OpenInNewIcon />}
            href={actionsUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub Actions
          </Button>
        }
      />
    </Box>
  );
};
