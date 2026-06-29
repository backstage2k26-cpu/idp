export interface Config {
  infrastructureResources?: {
    /** Cache TTL in minutes. Defaults to 7. */
    cacheTtlMinutes?: number;
    /** Annotation key for the application name. Defaults to company.com/application. */
    applicationAnnotation?: string;
    /** Annotation key for JSON-encoded infrastructure config. Defaults to company.com/infrastructure. */
    infrastructureAnnotation?: string;
    /** GCP label keys used to discover resources. Defaults to app and env. */
    labelKeys?: {
      application?: string;
      environment?: string;
    };
  };
}
