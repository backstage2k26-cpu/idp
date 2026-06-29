export type InfrastructureEnvironment = {
  name: string;
  project: string;
};

export type InfrastructureResource = {
  type: string;
  name: string;
  assetType?: string;
  /** Full GCP resource name, e.g. //storage.googleapis.com/projects/.../buckets/... */
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

export type ParsedInfrastructureConfig = {
  application: string;
  applications: string[];
  environments: InfrastructureEnvironment[];
};
