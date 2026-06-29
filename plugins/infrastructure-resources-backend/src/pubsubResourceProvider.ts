import { PubSub, Topic, Subscription } from '@google-cloud/pubsub';
import { LoggerService } from '@backstage/backend-plugin-api';
import { LabelKeys } from './cloudAssetClient';
import {
  extractResourceName,
  extractTopicLabels,
  matchesExpectedLabels,
} from './labelMatching';
import { InfrastructureResource } from './types';

export type PubSubResourceProviderOptions = {
  logger: LoggerService;
  labelKeys?: LabelKeys;
};

type PubSubItem = Topic | Subscription;

export type PubSubSearchOptions = {
  projectId: string;
  application: string;
  applications?: string[];
  environment: string;
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

  async searchResources(
    options: PubSubSearchOptions,
  ): Promise<InfrastructureResource[]> {
    const { projectId, application, applications, environment } = options;
    const pubsub = new PubSub({ projectId });
    const expected = { application, applications, environment };

    this.logger.info(
      `Listing Pub/Sub resources in project ${projectId} for ${(
        applications ?? [application]
      ).join(',')}/${environment}`,
    );

    const [topics, subscriptions] = await Promise.all([
      this.listAllTopics(pubsub),
      this.listAllSubscriptions(pubsub),
    ]);

    this.logger.info(
      `Found ${topics.length} Pub/Sub topics and ${subscriptions.length} subscriptions in ${projectId}`,
    );

    const [topicResources, subscriptionResources] = await Promise.all([
      this.collectMatchingResources(
        topics,
        'Pub/Sub Topic',
        'pubsub.googleapis.com/Topic',
        expected,
      ),
      this.collectMatchingResources(
        subscriptions,
        'Pub/Sub Subscription',
        'pubsub.googleapis.com/Subscription',
        expected,
      ),
    ]);

    const resources = [...topicResources, ...subscriptionResources];

    this.logger.info(
      `Matched ${resources.length} Pub/Sub resources in ${projectId}: ${
        resources
          .map(resource => `${resource.type}:${resource.name}`)
          .join(', ') || 'none'
      }`,
    );

    return resources;
  }

  private async listAllTopics(pubsub: PubSub): Promise<Topic[]> {
    const topics: Topic[] = [];
    let pageToken: string | undefined;

    do {
      const [page, , apiResponse] = await pubsub.getTopics({
        pageToken,
        autoPaginate: false,
      });
      topics.push(...page);
      pageToken = apiResponse?.nextPageToken || undefined;
    } while (pageToken);

    return topics;
  }

  private async listAllSubscriptions(pubsub: PubSub): Promise<Subscription[]> {
    const subscriptions: Subscription[] = [];
    let pageToken: string | undefined;

    do {
      const [page, , apiResponse] = await pubsub.getSubscriptions({
        pageToken,
        autoPaginate: false,
      });
      subscriptions.push(...page);
      pageToken = apiResponse?.nextPageToken || undefined;
    } while (pageToken);

    return subscriptions;
  }

  private async collectMatchingResources(
    items: PubSubItem[],
    type: string,
    assetType: string,
    expected: {
      application: string;
      applications?: string[];
      environment: string;
    },
  ): Promise<InfrastructureResource[]> {
    const results = await Promise.all(
      items.map(item =>
        this.toMatchingResource(item, type, assetType, expected),
      ),
    );

    return results.filter((resource): resource is InfrastructureResource =>
      Boolean(resource),
    );
  }

  private async toMatchingResource(
    item: PubSubItem,
    type: string,
    assetType: string,
    expected: {
      application: string;
      applications?: string[];
      environment: string;
    },
  ): Promise<InfrastructureResource | undefined> {
    const resourceName = extractResourceName(item.name);

    try {
      const labels = await this.readLabels(item);

      if (!matchesExpectedLabels(labels, expected, this.labelKeys)) {
        this.logger.debug(
          `Skipping ${type} ${resourceName}: labels ${JSON.stringify(
            labels ?? {},
          )} did not match ${JSON.stringify({
            applications: expected.applications ?? [expected.application],
            environment: expected.environment,
          })}`,
        );
        return undefined;
      }

      return {
        type,
        name: resourceName,
        assetType,
        fullName: item.name,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.warn(
        `Failed to read labels for ${type} ${resourceName}: ${message}`,
      );
      return undefined;
    }
  }

  private async readLabels(
    item: PubSubItem,
  ): Promise<Record<string, string> | undefined> {
    try {
      const [metadata] = await item.getMetadata();
      return extractTopicLabels(metadata);
    } catch {
      await new Promise(resolve => setTimeout(resolve, 250));
      const [metadata] = await item.getMetadata();
      return extractTopicLabels(metadata);
    }
  }
}
