type GcpConsoleLinkInput = {
  projectId: string;
  type: string;
  name: string;
  assetType?: string;
  fullName?: string;
};

const encode = (value: string) => encodeURIComponent(value);

const withProject = (path: string, projectId: string) =>
  `${path}${path.includes('?') ? '&' : '?'}project=${encode(projectId)}`;

/** Build a GCP Console deep link for a discovered resource. */
export const buildGcpConsoleUrl = ({
  projectId,
  type,
  name,
  assetType,
  fullName,
}: GcpConsoleLinkInput): string | undefined => {
  if (fullName) {
    const fromFullName = buildUrlFromFullName(fullName, projectId);
    if (fromFullName) {
      return fromFullName;
    }
  }

  return buildUrlFromAssetType(assetType, type, name, projectId);
};

const buildUrlFromFullName = (
  fullName: string,
  projectId: string,
): string | undefined => {
  const project = encode(projectId);

  const locationInstance = fullName.match(
    /\/locations\/([^/]+)\/instances\/([^/]+)$/,
  );
  if (locationInstance) {
    const [, location, instance] = locationInstance;
    if (fullName.includes('redis.googleapis.com')) {
      return `https://console.cloud.google.com/memorystore/redis/locations/${encode(
        location,
      )}/instances/${encode(instance)}?project=${project}`;
    }
  }

  const locationCluster = fullName.match(
    /\/locations\/([^/]+)\/clusters\/([^/]+)$/,
  );
  if (locationCluster && fullName.includes('container.googleapis.com')) {
    const [, location, cluster] = locationCluster;
    return `https://console.cloud.google.com/kubernetes/clusters/details/${encode(
      location,
    )}/${encode(cluster)}/details?project=${project}`;
  }

  const locationService = fullName.match(
    /\/locations\/([^/]+)\/services\/([^/]+)$/,
  );
  if (locationService && fullName.includes('run.googleapis.com')) {
    const [, location, service] = locationService;
    return `https://console.cloud.google.com/run/detail/${encode(
      location,
    )}/${encode(service)}/metrics?project=${project}`;
  }

  const locationRepository = fullName.match(
    /\/locations\/([^/]+)\/repositories\/([^/]+)$/,
  );
  if (
    locationRepository &&
    fullName.includes('artifactregistry.googleapis.com')
  ) {
    const [, location, repository] = locationRepository;
    return `https://console.cloud.google.com/artifacts/docker/${encode(
      projectId,
    )}/${encode(location)}/${encode(repository)}?project=${project}`;
  }

  if (fullName.includes('/buckets/')) {
    const bucket = fullName.split('/buckets/')[1]?.split('/')[0];
    if (bucket) {
      return `https://console.cloud.google.com/storage/browser/${encode(
        bucket,
      )}?project=${project}`;
    }
  }

  if (fullName.includes('/topics/')) {
    const topic = fullName.split('/topics/')[1]?.split('/')[0];
    if (topic) {
      return `https://console.cloud.google.com/cloudpubsub/topic/detail/${encode(
        topic,
      )}?project=${project}`;
    }
  }

  if (fullName.includes('/subscriptions/')) {
    const subscription = fullName.split('/subscriptions/')[1]?.split('/')[0];
    if (subscription) {
      return `https://console.cloud.google.com/cloudpubsub/subscription/detail/${encode(
        subscription,
      )}?project=${project}`;
    }
  }

  if (
    fullName.includes('sqladmin.googleapis.com') &&
    fullName.includes('/instances/')
  ) {
    const instance = fullName.split('/instances/')[1]?.split('/')[0];
    if (instance) {
      return `https://console.cloud.google.com/sql/instances/${encode(
        instance,
      )}/overview?project=${project}`;
    }
  }

  if (fullName.includes('/datasets/')) {
    const dataset = fullName.split('/datasets/')[1]?.split('/')[0];
    if (dataset) {
      return withProject(
        `https://console.cloud.google.com/bigquery?project=${project}&p=${project}&d=${encode(
          dataset,
        )}&page=dataset`,
        projectId,
      );
    }
  }

  if (fullName.includes('/secrets/')) {
    const secret = fullName.split('/secrets/')[1]?.split('/')[0];
    if (secret) {
      return `https://console.cloud.google.com/security/secret-manager/secret/${encode(
        secret,
      )}/versions?project=${project}`;
    }
  }

  if (fullName.includes('/serviceAccounts/')) {
    const serviceAccount = fullName
      .split('/serviceAccounts/')[1]
      ?.split('/')[0];
    if (serviceAccount) {
      return `https://console.cloud.google.com/iam-admin/serviceaccounts/details/${encode(
        serviceAccount,
      )}?project=${project}`;
    }
  }

  return undefined;
};

const buildUrlFromAssetType = (
  assetType: string | undefined,
  type: string,
  name: string,
  projectId: string,
): string | undefined => {
  const project = encode(projectId);
  const resourceName = encode(name);

  switch (assetType) {
    case 'storage.googleapis.com/Bucket':
      return `https://console.cloud.google.com/storage/browser/${resourceName}?project=${project}`;
    case 'pubsub.googleapis.com/Topic':
      return `https://console.cloud.google.com/cloudpubsub/topic/detail/${resourceName}?project=${project}`;
    case 'pubsub.googleapis.com/Subscription':
      return `https://console.cloud.google.com/cloudpubsub/subscription/detail/${resourceName}?project=${project}`;
    case 'sqladmin.googleapis.com/Instance':
      return `https://console.cloud.google.com/sql/instances/${resourceName}/overview?project=${project}`;
    case 'secretmanager.googleapis.com/Secret':
      return `https://console.cloud.google.com/security/secret-manager/secret/${resourceName}/versions?project=${project}`;
    case 'bigquery.googleapis.com/Dataset':
      return withProject(
        `https://console.cloud.google.com/bigquery?project=${project}&p=${project}&d=${resourceName}&page=dataset`,
        projectId,
      );
    case 'container.googleapis.com/Cluster':
      return `https://console.cloud.google.com/kubernetes/list/overview?project=${project}`;
    case 'run.googleapis.com/Service':
      return `https://console.cloud.google.com/run?project=${project}`;
    case 'redis.googleapis.com/Instance':
      return `https://console.cloud.google.com/memorystore/redis/instances?project=${project}`;
    case 'artifactregistry.googleapis.com/Repository':
      return `https://console.cloud.google.com/artifacts?project=${project}`;
    case 'iam.googleapis.com/ServiceAccount':
      return `https://console.cloud.google.com/iam-admin/serviceaccounts?project=${project}`;
    default:
      break;
  }

  switch (type) {
    case 'Cloud Storage Bucket':
      return `https://console.cloud.google.com/storage/browser/${resourceName}?project=${project}`;
    case 'Pub/Sub Topic':
      return `https://console.cloud.google.com/cloudpubsub/topic/detail/${resourceName}?project=${project}`;
    case 'Pub/Sub Subscription':
      return `https://console.cloud.google.com/cloudpubsub/subscription/detail/${resourceName}?project=${project}`;
    case 'Cloud SQL':
      return `https://console.cloud.google.com/sql/instances/${resourceName}/overview?project=${project}`;
    default:
      return `https://console.cloud.google.com/home/dashboard?project=${project}`;
  }
};
