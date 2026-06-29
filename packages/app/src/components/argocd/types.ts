export interface ArgoCdRepository {
  name: string;
  url: string;
  revision: string;
  namespace: string;
  project: string;
  cluster: string;
}

export interface ArgoCdHistoryItem {
  revision: string;
  deployedBy: string;
  started: string;
  finished: string;
}
