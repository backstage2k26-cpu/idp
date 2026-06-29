import { PubSub } from '@google-cloud/pubsub';
import { LoggerService } from '@backstage/backend-plugin-api';
import { LabelKeys } from './cloudAssetClient';
import { extractResourceName, matchesExpectedLabels } from './labelMatching';
import { InfrastructureResource } from './types';

export type PubSubResourceProviderOptions = {
  logger: LoggerService;
  labelKeys?: LabelKeys;
};

export class PubSubResourceProvider {
  private readonly logger: LoggerService;
  private readonly labelKeys: LabelKeys;

  constructor(options: PubSubResourceProviderOptions) {
    this.logger = options.logger;
    this.labelKeys = options.labelKeys ?? {
      application: 'app',
      environment: 'env',
    };
  }

  async searchResources(options: {
    projectId: string;
    application: string;
    environment: string;
  }): Promise<InfrastructureResource[]> {
    const { projectId, application, environment } = options;
    const pubsub = new PubSub({ projectId });
    const resources: InfrastructureResource[] = [];
    const expected = { application, environment };

    this.logger.info(
      `Listing Pub/Sub resources in project ${projectId} for ${application}/${environment}`,
    );

    const [topics] = await pubsub.getTopics();
    for (const topic of topics) {
      const [metadata] = await topic.getMetadata();
      const labels = metadata.labels ?? undefined;

      if (!matchesExpectedLabels(labels, expected, this.labelKeys)) {
        continue;
      }

      resources.push({
        type: 'Pub/Sub Topic',
        name: extractResourceName(topic.name),
        assetType: 'pubsub.googleapis.com/Topic',
      });
    }

    const [subscriptions] = await pubsub.getSubscriptions();
    for (const subscription of subscriptions) {
      const [metadata] = await subscription.getMetadata();
      const labels = metadata.labels ?? undefined;

      if (!matchesExpectedLabels(labels, expected, this.labelKeys)) {
        continue;
      }

      resources.push({
        type: 'Pub/Sub Subscription',
        name: extractResourceName(subscription.name),
        assetType: 'pubsub.googleapis.com/Subscription',
      });
    }

    this.logger.info(
      `Found ${resources.length} Pub/Sub resources in ${projectId}: ${resources
        .map(resource => `${resource.type}:${resource.name}`)
        .join(', ') || 'none'}`,
    );

    return resources;
  }
}
