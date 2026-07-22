import React, { useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  InputAdornment,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Link,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import SearchIcon from '@material-ui/icons/Search';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { Progress } from '@backstage/core-components';
import { EnvironmentResources, InfrastructureResource } from '../types';
import { ResourceIcon } from './ResourceIcon';
import { buildGcpConsoleUrl } from '../utils/gcpConsoleLinks';
import {
  GCP_COLORS,
  getEnvironmentColor,
  getResourceTypeColor,
} from '../theme/gcpTheme';

const useStyles = makeStyles(theme => ({
  accordion: {
    marginBottom: theme.spacing(2),
    borderRadius: theme.spacing(1),
    overflow: 'hidden',
    border: `1px solid ${GCP_COLORS.border}`,
    boxShadow: '0 1px 3px rgba(60, 64, 67, 0.12)',
    '&:before': {
      display: 'none',
    },
    '&.Mui-expanded': {
      margin: theme.spacing(0, 0, 2, 0),
    },
  },
  accordionSummary: {
    minHeight: 64,
    paddingLeft: theme.spacing(2),
    backgroundColor:
      theme.palette.type === 'dark'
        ? 'rgba(66, 133, 244, 0.08)'
        : GCP_COLORS.blueLight,
    '&.Mui-expanded': {
      minHeight: 64,
      borderBottom: `1px solid ${GCP_COLORS.border}`,
    },
    [theme.breakpoints.down('sm')]: {
      paddingLeft: theme.spacing(1.5),
      paddingRight: theme.spacing(1),
    },
  },
  accordionDetails: {
    display: 'block',
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1.5),
    },
  },
  summaryRow: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    gap: theme.spacing(1.5),
    minWidth: 0,
    [theme.breakpoints.down('sm')]: {
      alignItems: 'flex-start',
    },
  },
  envBadge: {
    color: '#ffffff',
    fontWeight: 600,
    fontSize: '0.75rem',
    letterSpacing: '0.06em',
    height: 24,
  },
  summaryText: {
    flex: 1,
    minWidth: 0,
  },
  environmentName: {
    fontWeight: 600,
    color:
      theme.palette.type === 'dark'
        ? theme.palette.text.primary
        : GCP_COLORS.textPrimary,
  },
  summaryMeta: {
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.25),
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing(0.5),
    minWidth: 0,
  },
  projectIcon: {
    fontSize: 14,
    marginRight: theme.spacing(0.25),
    verticalAlign: 'text-bottom',
    color: GCP_COLORS.blue,
  },
  resourceCountChip: {
    backgroundColor:
      theme.palette.type === 'dark'
        ? 'rgba(66, 133, 244, 0.2)'
        : GCP_COLORS.blueMuted,
    color: GCP_COLORS.blueDark,
    fontWeight: 500,
    height: 22,
  },
  tableContainer: {
    width: '100%',
    borderRadius: theme.spacing(1),
    border: `1px solid ${GCP_COLORS.border}`,
    overflowX: 'auto',
    overflowY: 'hidden',
  },
  table: {
    tableLayout: 'auto',
    width: '100%',
    minWidth: 560,
  },
  tableHeader: {
    fontWeight: 600,
    fontSize: '0.75rem',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: '#ffffff',
    backgroundColor: GCP_COLORS.blueDark,
    borderBottom: 'none',
  },
  tableRow: {
    '&:nth-of-type(even)': {
      backgroundColor:
        theme.palette.type === 'dark'
          ? 'rgba(255, 255, 255, 0.02)'
          : 'rgba(66, 133, 244, 0.04)',
    },
    '&:hover': {
      backgroundColor:
        theme.palette.type === 'dark'
          ? 'rgba(66, 133, 244, 0.12)'
          : GCP_COLORS.blueLight,
    },
  },
  typeCell: {
    width: '32%',
    verticalAlign: 'middle',
    wordBreak: 'break-word',
    borderBottom: `1px solid ${GCP_COLORS.border}`,
    [theme.breakpoints.down('sm')]: {
      width: '38%',
    },
  },
  nameCell: {
    width: '68%',
    verticalAlign: 'middle',
    wordBreak: 'break-word',
    borderBottom: `1px solid ${GCP_COLORS.border}`,
    fontFamily: 'Roboto Mono, monospace',
    fontSize: '0.875rem',
    minWidth: 260,
  },
  typeChip: {
    color: '#ffffff',
    fontWeight: 500,
    fontSize: '0.75rem',
    height: 24,
    maxWidth: '100%',
  },
  resourceName: {
    display: 'flex',
    alignItems: 'center',
    minWidth: 0,
  },
  resourceLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(0.75),
    color: GCP_COLORS.blue,
    fontWeight: 500,
    textDecoration: 'none',
    minWidth: 0,
    maxWidth: '100%',
    wordBreak: 'break-word',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  externalIcon: {
    fontSize: 16,
    opacity: 0.85,
  },
  resourceIcon: {
    marginRight: theme.spacing(1.25),
    flexShrink: 0,
  },
  errorText: {
    color: theme.palette.error.main,
    marginBottom: theme.spacing(1),
    padding: theme.spacing(1.5),
    borderRadius: theme.spacing(1),
    backgroundColor: 'rgba(234, 67, 53, 0.08)',
    border: '1px solid rgba(234, 67, 53, 0.25)',
  },
  emptyFilterText: {
    color: theme.palette.text.secondary,
    fontStyle: 'italic',
    padding: theme.spacing(2),
    textAlign: 'center',
    backgroundColor:
      theme.palette.type === 'dark'
        ? 'rgba(255, 255, 255, 0.04)'
        : 'rgba(66, 133, 244, 0.06)',
    borderRadius: theme.spacing(1),
  },
  filterBar: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(3),
    borderRadius: theme.spacing(1.5),
    border: `1px solid ${GCP_COLORS.border}`,
    backgroundColor: theme.palette.background.paper,
    boxShadow: '0 1px 2px rgba(60, 64, 67, 0.08)',
  },
  filtersRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(2),
  },
  typeFilterInput: {
    minWidth: 220,
    [theme.breakpoints.down('sm')]: {
      minWidth: '100%',
      width: '100%',
    },
  },
  searchFilterInput: {
    minWidth: 320,
    flex: 1,
    [theme.breakpoints.down('sm')]: {
      minWidth: '100%',
      width: '100%',
      flexBasis: '100%',
    },
  },
  filterField: {
    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: GCP_COLORS.blue,
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: GCP_COLORS.blue,
    },
  },
  expandIcon: {
    color: GCP_COLORS.blueDark,
  },
}));

type EnvironmentAccordionProps = {
  environment: EnvironmentResources;
  loading?: boolean;
  defaultExpanded?: boolean;
  typeFilter: string;
  searchQuery: string;
};

export const filterResources = (
  resources: InfrastructureResource[],
  typeFilter: string,
  searchQuery: string,
) => {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return resources.filter(resource => {
    const matchesType = typeFilter === 'all' || resource.type === typeFilter;
    const matchesSearch =
      !normalizedQuery ||
      resource.name.toLowerCase().includes(normalizedQuery) ||
      resource.type.toLowerCase().includes(normalizedQuery);

    return matchesType && matchesSearch;
  });
};

export const EnvironmentAccordion = ({
  environment,
  loading = false,
  defaultExpanded = false,
  typeFilter,
  searchQuery,
}: EnvironmentAccordionProps) => {
  const classes = useStyles();
  const envColor = getEnvironmentColor(environment.name);
  const filteredResources = useMemo(
    () => filterResources(environment.resources, typeFilter, searchQuery),
    [environment.resources, typeFilter, searchQuery],
  );

  const hasActiveFilter = typeFilter !== 'all' || searchQuery.trim().length > 0;
  const resourceCountLabel = loading
    ? '…'
    : filteredResources.length === environment.resources.length
    ? `${environment.resources.length}`
    : `${filteredResources.length}/${environment.resources.length}`;

  return (
    <Accordion
      className={classes.accordion}
      defaultExpanded={defaultExpanded}
      TransitionProps={{ unmountOnExit: true }}
      style={{ borderLeft: `4px solid ${envColor}` }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon className={classes.expandIcon} />}
        className={classes.accordionSummary}
      >
        <Box className={classes.summaryRow}>
          <Chip
            label={environment.name.toUpperCase()}
            size="small"
            className={classes.envBadge}
            style={{ backgroundColor: envColor }}
          />
          <Box className={classes.summaryText}>
            <Typography variant="subtitle1" className={classes.environmentName}>
              {environment.name.charAt(0).toUpperCase() +
                environment.name.slice(1)}{' '}
              environment
            </Typography>
            <Typography variant="body2" className={classes.summaryMeta}>
              <FolderOpenIcon className={classes.projectIcon} />
              {environment.project}
              <Chip
                label={
                  loading
                    ? 'Loading…'
                    : `${resourceCountLabel} resource${
                        environment.resources.length === 1 ? '' : 's'
                      }`
                }
                size="small"
                className={classes.resourceCountChip}
              />
            </Typography>
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails className={classes.accordionDetails}>
        {loading ? (
          <Progress />
        ) : (
          <>
            {environment.error && (
              <Typography variant="body2" className={classes.errorText}>
                Failed to load resources: {environment.error}
              </Typography>
            )}

            {environment.resources.length === 0 ? (
              <Typography variant="body2" color="textSecondary">
                No resources found for this environment.
              </Typography>
            ) : filteredResources.length === 0 ? (
              <Typography variant="body2" className={classes.emptyFilterText}>
                No resources match the current filters.
              </Typography>
            ) : (
              <TableContainer className={classes.tableContainer}>
                <Table size="small" className={classes.table}>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        className={`${classes.tableHeader} ${classes.typeCell}`}
                      >
                        Type
                      </TableCell>
                      <TableCell
                        className={`${classes.tableHeader} ${classes.nameCell}`}
                      >
                        Name
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredResources.map(resource => (
                      <TableRow
                        key={`${resource.type}-${resource.name}`}
                        className={classes.tableRow}
                      >
                        <TableCell className={classes.typeCell}>
                          <Chip
                            label={resource.type}
                            size="small"
                            className={classes.typeChip}
                            style={{
                              backgroundColor: getResourceTypeColor(
                                resource.type,
                              ),
                            }}
                          />
                        </TableCell>
                        <TableCell className={classes.nameCell}>
                          <span className={classes.resourceName}>
                            <span className={classes.resourceIcon}>
                              <ResourceIcon type={resource.type} />
                            </span>
                            <ResourceNameLink
                              resource={resource}
                              projectId={environment.project}
                              classes={classes}
                            />
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {hasActiveFilter && filteredResources.length > 0 && (
              <Box marginTop={1.5}>
                <Typography
                  variant="caption"
                  style={{ color: GCP_COLORS.textSecondary }}
                >
                  Showing {filteredResources.length} matching resource
                  {filteredResources.length === 1 ? '' : 's'}
                </Typography>
              </Box>
            )}
          </>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

type ResourceNameLinkProps = {
  resource: InfrastructureResource;
  projectId: string;
  classes: ReturnType<typeof useStyles>;
};

const ResourceNameLink = ({
  resource,
  projectId,
  classes,
}: ResourceNameLinkProps) => {
  const consoleUrl = buildGcpConsoleUrl({
    projectId,
    type: resource.type,
    name: resource.name,
    assetType: resource.assetType,
    fullName: resource.fullName,
  });

  if (!consoleUrl) {
    return <span>{resource.name}</span>;
  }

  return (
    <Link
      href={consoleUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={classes.resourceLink}
      title={`Open ${resource.name} in GCP Console`}
    >
      {resource.name}
      <OpenInNewIcon className={classes.externalIcon} />
    </Link>
  );
};

export const useResourceFilters = (
  environments: EnvironmentResources[] | undefined,
) => {
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const resourceTypes = useMemo(() => {
    const types = new Set<string>();
    environments?.forEach(environment => {
      environment.resources.forEach(resource => types.add(resource.type));
    });
    return Array.from(types).sort();
  }, [environments]);

  return {
    typeFilter,
    setTypeFilter,
    searchQuery,
    setSearchQuery,
    resourceTypes,
  };
};

type ResourceFiltersProps = {
  resourceTypes: string[];
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
};

export const ResourceFilters = ({
  resourceTypes,
  typeFilter,
  onTypeFilterChange,
  searchQuery,
  onSearchQueryChange,
}: ResourceFiltersProps) => {
  const classes = useStyles();

  return (
    <Paper className={classes.filterBar} elevation={0}>
      <Box className={classes.filtersRow}>
        <TextField
          select
          label="Resource type"
          value={typeFilter}
          onChange={event => onTypeFilterChange(event.target.value)}
          variant="outlined"
          size="small"
          className={`${classes.filterField} ${classes.typeFilterInput}`}
        >
          <MenuItem value="all">All types</MenuItem>
          {resourceTypes.map(type => (
            <MenuItem key={type} value={type}>
              {type}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Search by type or name"
          placeholder="e.g. Cloud, Pub/Sub, order-topic"
          value={searchQuery}
          onChange={event => onSearchQueryChange(event.target.value)}
          variant="outlined"
          size="small"
          className={`${classes.filterField} ${classes.searchFilterInput}`}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon
                  fontSize="small"
                  style={{ color: GCP_COLORS.blue }}
                />
              </InputAdornment>
            ),
          }}
        />
      </Box>
    </Paper>
  );
};
