export type InfrastructureResource = {
  type: string;
  name: string;
  assetType?: string;
  /** Full GCP resource name used to build console deep links */
  fullName?: string;
};

export type EnvironmentResources = {
  name: string;
  project: string;
  resources: InfrastructureResource[];
  error?: string;
};

export type InfrastructureResourcesResponse = {
  application: string;
  environments: EnvironmentResources[];
};

export type InfrastructureEnvironment = {
  name: string;
  project: string;
};
