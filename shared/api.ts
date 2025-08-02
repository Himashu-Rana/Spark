export interface DemoResponse {
  message: string;
}

export interface ApifyActor {
  id: string;
  name: string;
  title: string;
  description?: string;
  isPublic: boolean;
  username: string;
  createdAt: string;
  modifiedAt: string;
  stats: {
    totalRuns: number;
  };
}

export interface ApifyActorListResponse {
  data: {
    items: ApifyActor[];
    total: number;
    count: number;
    offset: number;
    limit: number;
  };
}

export interface ApifyInputSchema {
  title: string;
  type: string;
  description?: string;
  properties: Record<string, any>;
  required?: string[];
}

export interface ApifyActorVersion {
  versionNumber: string;
  buildTag: string;
  inputSchema?: ApifyInputSchema;
}

export interface ApifyActorDetailResponse {
  data: ApifyActor & {
    versions: ApifyActorVersion[];
    taggedBuilds?: {
      latest?: {
        buildId: string;
        buildNumber: string;
      };
    };
    exampleRunInput?: {
      body: string;
    };
    pricingInfos?: Array<{
      pricePerUnitUsd: number;
      trialMinutes: number;
    }>;
    categories?: string[];
  };
}

export interface ApifyRunInput {
  [key: string]: any;
}

export interface ApifyRun {
  id: string;
  actId: string;
  userId: string;
  startedAt: string;
  finishedAt?: string;
  status: 'READY' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'TIMED-OUT' | 'ABORTED';
  stats: {
    inputBytes?: number;
    outputBytes?: number;
    runTimeSecs?: number;
  };
  options: {
    build: string;
    timeoutSecs: number;
    memoryMbytes: number;
  };
  meta: {
    origin: string;
    clientIp: string;
    userAgent: string;
  };
}

export interface ApifyRunResponse {
  data: ApifyRun;
}

export interface ApifyDatasetItem {
  [key: string]: any;
}

export interface ApifyDatasetResponse {
  data: ApifyDatasetItem[];
}

export interface ListActorsResponse {
  actors: ApifyActor[];
  error?: string;
}

export interface GetActorSchemaResponse {
  schema: ApifyInputSchema | null;
  error?: string;
}

export interface ExecuteActorResponse {
  run: ApifyRun;
  results?: ApifyDatasetItem[];
  error?: string;
}

export interface ValidateApiKeyResponse {
  valid: boolean;
  error?: string;
}
