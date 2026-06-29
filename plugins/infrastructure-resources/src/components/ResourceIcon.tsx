import React from 'react';
import CloudIcon from '@material-ui/icons/Cloud';
import StorageIcon from '@material-ui/icons/Storage';
import DnsIcon from '@material-ui/icons/Dns';
import ForumIcon from '@material-ui/icons/Forum';
import TableChartIcon from '@material-ui/icons/TableChart';
import LockIcon from '@material-ui/icons/Lock';
import ArchiveIcon from '@material-ui/icons/Archive';
import RouterIcon from '@material-ui/icons/Router';
import MemoryIcon from '@material-ui/icons/Memory';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import DeviceHubIcon from '@material-ui/icons/DeviceHub';
import { makeStyles } from '@material-ui/core/styles';
import { getResourceTypeColor } from '../theme/gcpTheme';

const TYPE_ICON_MAP: Record<string, React.ElementType> = {
  'GKE Cluster': DeviceHubIcon,
  'Cloud SQL': StorageIcon,
  'Pub/Sub Topic': ForumIcon,
  'Pub/Sub Subscription': ForumIcon,
  'BigQuery Dataset': TableChartIcon,
  'Cloud Storage Bucket': ArchiveIcon,
  Memorystore: MemoryIcon,
  'Secret Manager': LockIcon,
  'Artifact Registry': ArchiveIcon,
  'Load Balancer': RouterIcon,
  'Cloud Run': CloudIcon,
  VPC: DnsIcon,
  'Service Account': AccountCircleIcon,
};

const useStyles = makeStyles({
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
  },
});

type ResourceIconProps = {
  type: string;
};

export const ResourceIcon = ({ type }: ResourceIconProps) => {
  const classes = useStyles();
  const Icon = TYPE_ICON_MAP[type] ?? CloudIcon;
  const color = getResourceTypeColor(type);

  return (
    <span
      className={classes.iconBadge}
      style={{ backgroundColor: color }}
      aria-hidden
    >
      <Icon style={{ fontSize: 16 }} />
    </span>
  );
};
