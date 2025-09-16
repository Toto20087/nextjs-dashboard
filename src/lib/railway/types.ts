/**
 * Type definitions for Railway API integration
 */

export interface RailwayProject {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  environments: RailwayEnvironment[]
}

export interface RailwayEnvironment {
  id: string
  name: string
  isProduction: boolean
}

export interface RailwayService {
  id: string
  name: string
  icon?: string
  createdAt: string
  updatedAt: string
  deployments: RailwayDeployment[]
}

export interface RailwayDeployment {
  id: string
  serviceId: string
  status: 'BUILDING' | 'DEPLOYING' | 'SUCCESS' | 'FAILED' | 'CRASHED' | 'REMOVED' | 'SLEEPING'
  createdAt: string
  updatedAt: string
  url?: string
  staticUrl?: string
  meta: Record<string, any>
  canRedeploy: boolean
  canRollback: boolean
}

export interface RailwayMetrics {
  cpu: {
    timestamps: string[]
    values: number[]
  }
  memory: {
    timestamps: string[]
    values: number[]
  }
  network: {
    timestamps: string[]
    values: number[]
  }
}

export interface RailwayUsage {
  current: {
    cpuHours: number
    memoryGbHours: number
    networkGb: number
    diskGbHours: number
  }
  estimated: {
    cpuHours: number
    memoryGbHours: number
    networkGb: number
    diskGbHours: number
  }
  subscription: {
    plan: 'hobby' | 'pro' | 'team'
    billingPeriodStart?: string
    billingPeriodEnd?: string
  }
}

export interface RailwayIncident {
  id: string
  name: string
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved'
  impact: 'none' | 'minor' | 'major' | 'critical'
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  shortlink: string
  components: Array<{
    id: string
    name: string
    status: string
  }>
  updates: Array<{
    id: string
    status: string
    body: string
    createdAt: string
  }>
}

export interface RailwayLog {
  timestamp: string
  message: string
  severity: 'info' | 'warn' | 'error'
  source?: string
  metadata?: Record<string, any>
}

export interface RailwayVariable {
  id: string
  name: string
  value?: string
  isSecret: boolean
  environmentId?: string
  serviceId?: string
}

export interface RailwayDomain {
  id: string
  domain: string
  serviceId: string
  environmentId: string
  isCustom: boolean
  status: 'pending' | 'active' | 'error'
  certificate?: {
    status: 'pending' | 'active' | 'error'
    expiresAt: string
  }
}

// Status and health types
export interface RailwayServiceHealth {
  serviceId: string
  serviceName: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  lastDeployment: {
    id: string
    status: RailwayDeployment['status']
    createdAt: string
    url?: string
  }
  metrics: {
    uptime: number
    responseTime: number
    errorRate: number
  }
  incidents: number
}

export interface RailwayProjectHealth {
  projectId: string
  projectName: string
  overallStatus: 'healthy' | 'degraded' | 'unhealthy'
  services: RailwayServiceHealth[]
  usage: RailwayUsage
  lastUpdated: string
}

// Deployment and build types
export interface RailwayBuildLog {
  id: string
  timestamp: string
  message: string
  stream: 'stdout' | 'stderr'
  deploymentId: string
}

export interface RailwayDeploymentConfig {
  serviceId: string
  environmentId: string
  variables?: Record<string, string>
  source?: {
    type: 'github' | 'gitlab' | 'docker'
    repo?: string
    branch?: string
    dockerfile?: string
    buildCommand?: string
    startCommand?: string
  }
  resources?: {
    cpu?: number
    memory?: number
    replicas?: number
  }
  domains?: string[]
}

// Monitoring and alerting types
export interface RailwayAlert {
  id: string
  name: string
  description?: string
  serviceId: string
  environmentId: string
  type: 'cpu' | 'memory' | 'disk' | 'network' | 'uptime' | 'response_time'
  condition: {
    operator: 'greater_than' | 'less_than' | 'equals'
    threshold: number
    duration: number // seconds
  }
  notifications: Array<{
    type: 'email' | 'slack' | 'discord' | 'webhook'
    target: string
    enabled: boolean
  }>
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface RailwayAlertTrigger {
  id: string
  alertId: string
  triggeredAt: string
  resolvedAt?: string
  value: number
  message: string
  notifications: Array<{
    type: string
    target: string
    status: 'sent' | 'failed'
    sentAt: string
    error?: string
  }>
}

// Infrastructure monitoring types
export interface RailwayInfrastructureStatus {
  timestamp: string
  projects: Array<{
    id: string
    name: string
    status: 'healthy' | 'degraded' | 'unhealthy'
    serviceCount: number
    activeDeployments: number
    failedDeployments: number
  }>
  totalUsage: RailwayUsage['current']
  systemHealth: {
    status: 'operational' | 'degraded' | 'major_outage'
    uptime: number
    incidents: Array<{
      id: string
      status: RailwayIncident['status']
      impact: RailwayIncident['impact']
      affectedServices: string[]
    }>
  }
  performance: {
    averageDeploymentTime: number
    averageResponseTime: number
    successRate: number
  }
}

// Database and storage types
export interface RailwayDatabase {
  id: string
  name: string
  type: 'postgresql' | 'mysql' | 'redis' | 'mongodb'
  version: string
  status: 'running' | 'stopped' | 'error'
  connectionString: string
  metrics: {
    connections: number
    diskUsage: number
    memoryUsage: number
  }
  backups: Array<{
    id: string
    createdAt: string
    size: number
    status: 'completed' | 'failed' | 'in_progress'
  }>
}

export interface RailwayVolume {
  id: string
  name: string
  size: number // GB
  mountPath: string
  serviceId: string
  status: 'attached' | 'detached' | 'error'
  metrics: {
    usedSpace: number
    availableSpace: number
    iops: number
  }
}

// Cost and billing types
export interface RailwayCostBreakdown {
  projectId: string
  billingPeriod: {
    start: string
    end: string
  }
  costs: {
    compute: {
      cpuHours: number
      cost: number
    }
    memory: {
      gbHours: number
      cost: number
    }
    network: {
      gb: number
      cost: number
    }
    storage: {
      gbHours: number
      cost: number
    }
    databases: {
      instances: number
      cost: number
    }
    total: number
  }
  forecasted: {
    endOfMonth: number
    confidence: number
  }
}

// API response types
export interface RailwayApiResponse<T> {
  data: T
  errors?: Array<{
    message: string
    locations?: Array<{
      line: number
      column: number
    }>
    path?: string[]
    extensions?: Record<string, any>
  }>
}

export interface RailwayPaginatedResponse<T> {
  edges: Array<{
    node: T
    cursor: string
  }>
  pageInfo: {
    hasNextPage: boolean
    hasPreviousPage: boolean
    startCursor?: string
    endCursor?: string
  }
  totalCount?: number
}

// Webhook payload types
export interface RailwayWebhookPayload {
  type: 'deployment.created' | 'deployment.succeeded' | 'deployment.failed' | 'service.removed'
  timestamp: string
  project: {
    id: string
    name: string
  }
  environment: {
    id: string
    name: string
  }
  service: {
    id: string
    name: string
  }
  deployment?: {
    id: string
    status: RailwayDeployment['status']
    url?: string
    meta: Record<string, any>
  }
  user?: {
    id: string
    name: string
    email: string
  }
}

// Utility types
export type RailwayDeploymentStatus = RailwayDeployment['status']
export type RailwayIncidentStatus = RailwayIncident['status']
export type RailwayIncidentImpact = RailwayIncident['impact']
export type RailwayPlan = RailwayUsage['subscription']['plan']
export type RailwayLogSeverity = RailwayLog['severity']
export type RailwayAlertType = RailwayAlert['type']
export type RailwayAlertOperator = RailwayAlert['condition']['operator']