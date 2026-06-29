import React from 'react';
import { Chip, Grid, Link, Typography, makeStyles } from '@material-ui/core';
import { InfoCard } from '@backstage/core-components';
import { useEntity } from '@backstage/plugin-catalog-react';
import {
  formatPlatformFieldValue,
  getOrderedPlatformFields,
  getPlatformFieldLabel,
  getPlatformSpec,
} from './platformSpec';

const useStyles = makeStyles(theme => ({
  label: {
    color: theme.palette.text.secondary,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: theme.typography.fontWeightBold as number,
    letterSpacing: 0.5,
    marginBottom: theme.spacing(0.5),
    textTransform: 'uppercase',
  },
  value: {
    fontWeight: theme.typography.fontWeightMedium as number,
    wordBreak: 'break-word',
  },
}));

const getJiraUrl = (
  jiraId: string,
  jiraBaseUrl?: string,
): string | undefined => {
  if (!jiraBaseUrl) {
    return undefined;
  }

  const normalizedBaseUrl = jiraBaseUrl.replace(/\/$/, '');
  return `${normalizedBaseUrl}/browse/${encodeURIComponent(jiraId)}`;
};

const PlatformFieldValue = ({
  fieldName,
  value,
}: {
  fieldName: string;
  value: string | number | boolean;
}) => {
  const classes = useStyles();
  const { entity } = useEntity();
  const formattedValue = formatPlatformFieldValue(value);

  if (fieldName === 'setupApproved') {
    const approved = value === true || value === 'true';
    return (
      <Chip
        size="small"
        label={formattedValue}
        color={approved ? 'primary' : 'default'}
      />
    );
  }

  if (fieldName === 'jiraId' && typeof value === 'string') {
    const jiraBaseUrl =
      entity.metadata.annotations?.['platform.io/jira-base-url'];
    const jiraUrl = getJiraUrl(value, jiraBaseUrl);

    if (jiraUrl) {
      return (
        <Link href={jiraUrl} target="_blank" rel="noopener noreferrer">
          {formattedValue}
        </Link>
      );
    }
  }

  return <Typography className={classes.value}>{formattedValue}</Typography>;
};

export const EntityPlatformInfoCard = () => {
  const classes = useStyles();
  const { entity } = useEntity();
  const platform = getPlatformSpec(entity);

  if (!platform) {
    return null;
  }

  const fields = getOrderedPlatformFields(platform);

  return (
    <InfoCard title="Platform Information" variant="gridItem">
      <Grid container spacing={2}>
        {fields.map(([fieldName, value]) => (
          <Grid item xs={12} sm={6} md={4} key={fieldName}>
            <Typography className={classes.label}>
              {getPlatformFieldLabel(fieldName)}
            </Typography>
            <PlatformFieldValue fieldName={fieldName} value={value} />
          </Grid>
        ))}
      </Grid>
    </InfoCard>
  );
};
