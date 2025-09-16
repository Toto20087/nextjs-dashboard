/**
 * Type definitions for N8N workflow API integration
 */

export interface N8NWorkflowRequest {
  workflowId: string
  data?: Record<string, any>
  waitTill?: 'execution'
}

export interface N8NWorkflowResponse {
  data: {
    executionId: string
    finished: boolean
    mode: 'manual' | 'trigger'
    startedAt: string
    stoppedAt?: string
    workflowId: string
  }
  success: boolean
}

export interface N8NExecutionStatus {
  id: string
  finished: boolean
  mode: 'manual' | 'trigger' | 'webhook'
  retryOf?: string
  retrySuccessId?: string
  startedAt: string
  stoppedAt?: string
  workflowId: string
  status: 'new' | 'running' | 'success' | 'error' | 'canceled' | 'crashed' | 'waiting'
  error?: {
    message: string
    stack?: string
    timestamp: string
  }
  data?: {
    resultData: {
      runData: Record<string, any[]>
    }
    executionData?: {
      contextData: Record<string, any>
      nodeExecutionStack: any[]
      metadata: Record<string, any>
    }
  }
}

export interface N8NExecutionResult {
  id: string
  finished: boolean
  mode: string
  startedAt: string
  stoppedAt: string
  workflowData: {
    id: string
    name: string
    active: boolean
    nodes: N8NWorkflowNode[]
    connections: Record<string, any>
    settings: Record<string, any>
    staticData: Record<string, any>
  }
  data: {
    resultData: {
      runData: Record<string, N8NNodeExecution[]>
      lastNodeExecuted?: string
    }
    executionData?: {
      contextData: Record<string, any>
      nodeExecutionStack: any[]
      metadata: Record<string, any>
    }
  }
}

export interface N8NWorkflowNode {
  id: string
  name: string
  type: string
  typeVersion: number
  position: [number, number]
  parameters: Record<string, any>
  credentials?: Record<string, string>
  webhookId?: string
  disabled?: boolean
}

export interface N8NNodeExecution {
  startTime: number
  executionTime: number
  data?: {
    main: Array<Array<{
      json: Record<string, any>
      binary?: Record<string, any>
      pairedItem?: {
        item: number
      }
    }>>
  }
  error?: {
    message: string
    description?: string
    stack?: string
  }
}

// Specific workflow result types
export interface NewsAnalysisResult {
  executionId: string
  status: 'completed' | 'failed'
  results: Array<{
    articleId: string
    title: string
    url: string
    sentiment: {
      score: number // -1 to 1
      magnitude: number // 0 to 1
      label: 'positive' | 'negative' | 'neutral'
      confidence: number // 0 to 1
    }
    keywords: Array<{
      text: string
      relevance: number
      sentiment?: {
        score: number
        label: string
      }
    }>
    entities: Array<{
      name: string
      type: 'PERSON' | 'ORGANIZATION' | 'LOCATION' | 'EVENT' | 'WORK_OF_ART' | 'CONSUMER_GOOD' | 'OTHER'
      relevance: number
      sentiment?: {
        score: number
        label: string
      }
    }>
    summary: string
    processedAt: string
  }>
  processingTime: number
  error?: string
}

export interface MarketSentimentResult {
  executionId: string
  status: 'completed' | 'failed'
  results: Array<{
    symbol: string
    sentiment: {
      overall: {
        score: number
        label: 'bullish' | 'bearish' | 'neutral'
        confidence: number
      }
      news: {
        score: number
        articleCount: number
        sources: string[]
      }
      social: {
        score: number
        mentionCount: number
        platforms: string[]
      }
      technical: {
        score: number
        indicators: Array<{
          name: string
          signal: 'buy' | 'sell' | 'hold'
          strength: number
        }>
      }
    }
    trends: Array<{
      timeframe: string
      direction: 'up' | 'down' | 'sideways'
      strength: number
      confidence: number
    }>
    processedAt: string
  }>
  timeframe: string
  processingTime: number
  error?: string
}

export interface PerformanceAlertResult {
  executionId: string
  status: 'completed' | 'failed'
  alerts: Array<{
    type: 'performance_threshold' | 'drawdown_limit' | 'risk_breach' | 'profit_target'
    severity: 'low' | 'medium' | 'high' | 'critical'
    message: string
    strategyId: string
    strategyName: string
    metric: string
    currentValue: number
    threshold: number
    action: 'notification_sent' | 'email_sent' | 'position_closed' | 'trading_paused'
    channels: Array<{
      type: 'email' | 'slack' | 'discord' | 'webhook'
      success: boolean
      error?: string
    }>
    timestamp: string
  }>
  processingTime: number
  error?: string
}

// Workflow configuration types
export interface N8NWorkflowConfig {
  id: string
  name: string
  description?: string
  active: boolean
  triggers: Array<{
    type: 'webhook' | 'schedule' | 'manual'
    config: Record<string, any>
  }>
  nodes: N8NWorkflowNode[]
  settings: {
    timeout?: number
    retryOnFail?: boolean
    maxRetries?: number
    retryDelay?: number
    saveDataErrorExecution?: 'all' | 'none'
    saveDataSuccessExecution?: 'all' | 'none'
    saveManualExecutions?: boolean
    callerPolicy?: 'workflowsFromSameOwner' | 'workflowsFromAList' | 'any'
  }
  tags?: string[]
  meta?: Record<string, any>
}

// Queue and execution management types
export interface N8NQueueStatus {
  active: number
  waiting: number
  completed: number
  failed: number
  delayed: number
  paused: number
}

export interface N8NSystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  version: string
  environment: string
  database: {
    status: 'connected' | 'disconnected'
    type: string
  }
  queue: N8NQueueStatus
  executions: {
    active: number
    total24h: number
    success24h: number
    error24h: number
  }
  workflows: {
    total: number
    active: number
    inactive: number
  }
  uptime: number
  memory: {
    used: number
    total: number
    usage: number
  }
  cpu: {
    usage: number
  }
}

// Error types
export interface N8NErrorResponse {
  error: {
    code: number
    message: string
    hint?: string
    details?: any
  }
}

export interface N8NValidationError {
  field: string
  message: string
  code: string
}

// Webhook types for receiving N8N callbacks
export interface N8NWebhookPayload {
  executionId: string
  workflowId: string
  status: 'success' | 'error' | 'canceled'
  timestamp: string
  data?: any
  error?: {
    message: string
    details?: any
  }
}

// Export utility types
export type N8NExecutionStatusType = N8NExecutionStatus['status']
export type N8NSentimentLabel = NewsAnalysisResult['results'][0]['sentiment']['label']
export type N8NAlertType = PerformanceAlertResult['alerts'][0]['type']
export type N8NAlertSeverity = PerformanceAlertResult['alerts'][0]['severity']
export type N8NChannelType = PerformanceAlertResult['alerts'][0]['channels'][0]['type']

// Workflow template types
export interface N8NWorkflowTemplate {
  id: string
  name: string
  description: string
  category: 'trading' | 'analysis' | 'alerts' | 'reporting'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  requiredCredentials: string[]
  requiredNodes: string[]
  estimatedExecutionTime: string
  workflow: N8NWorkflowConfig
  documentation?: {
    setup: string
    usage: string
    examples: Array<{
      title: string
      description: string
      input: Record<string, any>
      expectedOutput: Record<string, any>
    }>
  }
}

// Batch execution types
export interface N8NBatchExecutionRequest {
  workflowId: string
  executions: Array<{
    id: string
    data: Record<string, any>
  }>
  options?: {
    parallel?: boolean
    maxConcurrency?: number
    failFast?: boolean
    timeout?: number
  }
}

export interface N8NBatchExecutionResult {
  batchId: string
  workflowId: string
  totalExecutions: number
  completedExecutions: number
  failedExecutions: number
  results: Array<{
    executionId: string
    status: 'success' | 'error' | 'timeout'
    result?: any
    error?: string
    processingTime: number
  }>
  processingTime: number
}