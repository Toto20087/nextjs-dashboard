/**
 * Utility functions for N8N workflow processing and data handling
 */

import { 
  N8NExecutionResult, 
  NewsAnalysisResult, 
  MarketSentimentResult, 
  PerformanceAlertResult,
  N8NNodeExecution,
  N8NWorkflowConfig
} from './types'

/**
 * Extract news analysis results from N8N execution data
 */
export function parseNewsAnalysisResult(execution: N8NExecutionResult): NewsAnalysisResult {
  const { id, finished, startedAt, stoppedAt, data } = execution
  
  if (!finished || !data?.resultData?.runData) {
    return {
      executionId: id,
      status: 'failed',
      results: [],
      processingTime: 0,
      error: 'Execution not completed or no result data'
    }
  }

  const processingTime = new Date(stoppedAt).getTime() - new Date(startedAt).getTime()
  
  try {
    // Look for the final output node (typically named something like 'Set' or 'Code')
    const outputNodeNames = ['NewsAnalysisOutput', 'FinalResults', 'Set', 'Code']
    let outputData: any = null
    
    for (const nodeName of outputNodeNames) {
      if (data.resultData.runData[nodeName]) {
        const nodeExecutions = data.resultData.runData[nodeName]
        if (nodeExecutions.length > 0 && nodeExecutions[0].data?.main?.[0]) {
          outputData = nodeExecutions[0].data.main[0]
          break
        }
      }
    }

    if (!outputData || !Array.isArray(outputData)) {
      throw new Error('No valid output data found')
    }

    const results = outputData.map((item: any) => ({
      articleId: item.json.articleId || item.json.id || generateId(),
      title: item.json.title || '',
      url: item.json.url || '',
      sentiment: {
        score: parseFloat(item.json.sentiment?.score || 0),
        magnitude: parseFloat(item.json.sentiment?.magnitude || 0),
        label: item.json.sentiment?.label || 'neutral',
        confidence: parseFloat(item.json.sentiment?.confidence || 0)
      },
      keywords: Array.isArray(item.json.keywords) ? item.json.keywords.map((kw: any) => ({
        text: kw.text || kw.keyword || '',
        relevance: parseFloat(kw.relevance || 0),
        sentiment: kw.sentiment ? {
          score: parseFloat(kw.sentiment.score || 0),
          label: kw.sentiment.label || 'neutral'
        } : undefined
      })) : [],
      entities: Array.isArray(item.json.entities) ? item.json.entities.map((entity: any) => ({
        name: entity.name || '',
        type: entity.type || 'OTHER',
        relevance: parseFloat(entity.relevance || 0),
        sentiment: entity.sentiment ? {
          score: parseFloat(entity.sentiment.score || 0),
          label: entity.sentiment.label || 'neutral'
        } : undefined
      })) : [],
      summary: item.json.summary || '',
      processedAt: item.json.processedAt || new Date().toISOString()
    }))

    return {
      executionId: id,
      status: 'completed',
      results,
      processingTime,
    }
  } catch (error) {
    return {
      executionId: id,
      status: 'failed',
      results: [],
      processingTime,
      error: error instanceof Error ? error.message : 'Unknown parsing error'
    }
  }
}

/**
 * Extract market sentiment analysis results from N8N execution data
 */
export function parseMarketSentimentResult(execution: N8NExecutionResult): MarketSentimentResult {
  const { id, finished, startedAt, stoppedAt, data } = execution
  
  if (!finished || !data?.resultData?.runData) {
    return {
      executionId: id,
      status: 'failed',
      results: [],
      timeframe: '1day',
      processingTime: 0,
      error: 'Execution not completed or no result data'
    }
  }

  const processingTime = new Date(stoppedAt).getTime() - new Date(startedAt).getTime()
  
  try {
    const outputNodeNames = ['SentimentOutput', 'MarketAnalysis', 'Results']
    let outputData: any = null
    
    for (const nodeName of outputNodeNames) {
      if (data.resultData.runData[nodeName]) {
        const nodeExecutions = data.resultData.runData[nodeName]
        if (nodeExecutions.length > 0 && nodeExecutions[0].data?.main?.[0]) {
          outputData = nodeExecutions[0].data.main[0]
          break
        }
      }
    }

    if (!outputData || !Array.isArray(outputData)) {
      throw new Error('No valid output data found')
    }

    const results = outputData.map((item: any) => ({
      symbol: item.json.symbol || '',
      sentiment: {
        overall: {
          score: parseFloat(item.json.sentiment?.overall?.score || 0),
          label: item.json.sentiment?.overall?.label || 'neutral',
          confidence: parseFloat(item.json.sentiment?.overall?.confidence || 0)
        },
        news: {
          score: parseFloat(item.json.sentiment?.news?.score || 0),
          articleCount: parseInt(item.json.sentiment?.news?.articleCount || 0),
          sources: Array.isArray(item.json.sentiment?.news?.sources) ? item.json.sentiment.news.sources : []
        },
        social: {
          score: parseFloat(item.json.sentiment?.social?.score || 0),
          mentionCount: parseInt(item.json.sentiment?.social?.mentionCount || 0),
          platforms: Array.isArray(item.json.sentiment?.social?.platforms) ? item.json.sentiment.social.platforms : []
        },
        technical: {
          score: parseFloat(item.json.sentiment?.technical?.score || 0),
          indicators: Array.isArray(item.json.sentiment?.technical?.indicators) ? 
            item.json.sentiment.technical.indicators.map((ind: any) => ({
              name: ind.name || '',
              signal: ind.signal || 'hold',
              strength: parseFloat(ind.strength || 0)
            })) : []
        }
      },
      trends: Array.isArray(item.json.trends) ? item.json.trends.map((trend: any) => ({
        timeframe: trend.timeframe || '1d',
        direction: trend.direction || 'sideways',
        strength: parseFloat(trend.strength || 0),
        confidence: parseFloat(trend.confidence || 0)
      })) : [],
      processedAt: item.json.processedAt || new Date().toISOString()
    }))

    return {
      executionId: id,
      status: 'completed',
      results,
      timeframe: outputData[0]?.json?.timeframe || '1day',
      processingTime,
    }
  } catch (error) {
    return {
      executionId: id,
      status: 'failed',
      results: [],
      timeframe: '1day',
      processingTime,
      error: error instanceof Error ? error.message : 'Unknown parsing error'
    }
  }
}

/**
 * Extract performance alert results from N8N execution data
 */
export function parsePerformanceAlertResult(execution: N8NExecutionResult): PerformanceAlertResult {
  const { id, finished, startedAt, stoppedAt, data } = execution
  
  if (!finished || !data?.resultData?.runData) {
    return {
      executionId: id,
      status: 'failed',
      alerts: [],
      processingTime: 0,
      error: 'Execution not completed or no result data'
    }
  }

  const processingTime = new Date(stoppedAt).getTime() - new Date(startedAt).getTime()
  
  try {
    const outputNodeNames = ['AlertOutput', 'Notifications', 'Results']
    let outputData: any = null
    
    for (const nodeName of outputNodeNames) {
      if (data.resultData.runData[nodeName]) {
        const nodeExecutions = data.resultData.runData[nodeName]
        if (nodeExecutions.length > 0 && nodeExecutions[0].data?.main?.[0]) {
          outputData = nodeExecutions[0].data.main[0]
          break
        }
      }
    }

    if (!outputData || !Array.isArray(outputData)) {
      throw new Error('No valid output data found')
    }

    const alerts = outputData.map((item: any) => ({
      type: item.json.type || 'performance_threshold',
      severity: item.json.severity || 'medium',
      message: item.json.message || '',
      strategyId: item.json.strategyId || '',
      strategyName: item.json.strategyName || '',
      metric: item.json.metric || '',
      currentValue: parseFloat(item.json.currentValue || 0),
      threshold: parseFloat(item.json.threshold || 0),
      action: item.json.action || 'notification_sent',
      channels: Array.isArray(item.json.channels) ? item.json.channels.map((ch: any) => ({
        type: ch.type || 'email',
        success: Boolean(ch.success),
        error: ch.error || undefined
      })) : [],
      timestamp: item.json.timestamp || new Date().toISOString()
    }))

    return {
      executionId: id,
      status: 'completed',
      alerts,
      processingTime,
    }
  } catch (error) {
    return {
      executionId: id,
      status: 'failed',
      alerts: [],
      processingTime,
      error: error instanceof Error ? error.message : 'Unknown parsing error'
    }
  }
}

/**
 * Validate N8N workflow configuration
 */
export function validateWorkflowConfig(config: Partial<N8NWorkflowConfig>): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!config.name || config.name.trim() === '') {
    errors.push('Workflow name is required')
  }

  if (!Array.isArray(config.nodes) || config.nodes.length === 0) {
    errors.push('Workflow must contain at least one node')
  }

  if (config.nodes) {
    // Check for duplicate node IDs
    const nodeIds = config.nodes.map(node => node.id)
    const duplicateIds = nodeIds.filter((id, index) => nodeIds.indexOf(id) !== index)
    if (duplicateIds.length > 0) {
      errors.push(`Duplicate node IDs found: ${duplicateIds.join(', ')}`)
    }

    // Validate individual nodes
    config.nodes.forEach((node, index) => {
      if (!node.id || node.id.trim() === '') {
        errors.push(`Node at index ${index} must have an ID`)
      }
      if (!node.name || node.name.trim() === '') {
        errors.push(`Node at index ${index} must have a name`)
      }
      if (!node.type || node.type.trim() === '') {
        errors.push(`Node at index ${index} must have a type`)
      }
    })
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Calculate workflow execution metrics
 */
export function calculateExecutionMetrics(executions: N8NExecutionResult[]): {
  totalExecutions: number
  successRate: number
  averageExecutionTime: number
  totalProcessingTime: number
  errorRate: number
  mostCommonErrors: Array<{ message: string; count: number }>
} {
  if (executions.length === 0) {
    return {
      totalExecutions: 0,
      successRate: 0,
      averageExecutionTime: 0,
      totalProcessingTime: 0,
      errorRate: 0,
      mostCommonErrors: []
    }
  }

  const successfulExecutions = executions.filter(ex => ex.finished && !hasExecutionError(ex))
  const failedExecutions = executions.filter(ex => !ex.finished || hasExecutionError(ex))
  
  const executionTimes = executions
    .filter(ex => ex.startedAt && ex.stoppedAt)
    .map(ex => new Date(ex.stoppedAt).getTime() - new Date(ex.startedAt).getTime())
  
  const averageExecutionTime = executionTimes.length > 0 
    ? executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length 
    : 0

  const totalProcessingTime = executionTimes.reduce((sum, time) => sum + time, 0)

  // Collect error messages
  const errorMessages: string[] = []
  failedExecutions.forEach(ex => {
    const errors = extractExecutionErrors(ex)
    errorMessages.push(...errors)
  })

  // Count error occurrences
  const errorCounts: Record<string, number> = {}
  errorMessages.forEach(error => {
    errorCounts[error] = (errorCounts[error] || 0) + 1
  })

  const mostCommonErrors = Object.entries(errorCounts)
    .map(([message, count]) => ({ message, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return {
    totalExecutions: executions.length,
    successRate: (successfulExecutions.length / executions.length) * 100,
    averageExecutionTime,
    totalProcessingTime,
    errorRate: (failedExecutions.length / executions.length) * 100,
    mostCommonErrors
  }
}

/**
 * Check if execution has errors
 */
export function hasExecutionError(execution: N8NExecutionResult): boolean {
  if (!execution.data?.resultData?.runData) return true
  
  for (const nodeExecutions of Object.values(execution.data.resultData.runData)) {
    for (const nodeExecution of nodeExecutions) {
      if (nodeExecution.error) return true
    }
  }
  
  return false
}

/**
 * Extract error messages from execution
 */
export function extractExecutionErrors(execution: N8NExecutionResult): string[] {
  const errors: string[] = []
  
  if (!execution.data?.resultData?.runData) {
    errors.push('No execution data available')
    return errors
  }
  
  for (const [nodeName, nodeExecutions] of Object.entries(execution.data.resultData.runData)) {
    for (const nodeExecution of nodeExecutions) {
      if (nodeExecution.error) {
        errors.push(`${nodeName}: ${nodeExecution.error.message}`)
      }
    }
  }
  
  return errors
}

/**
 * Format execution duration
 */
export function formatExecutionDuration(startTime: string, endTime: string): string {
  const duration = new Date(endTime).getTime() - new Date(startTime).getTime()
  
  if (duration < 1000) {
    return `${duration}ms`
  }
  
  if (duration < 60000) {
    return `${(duration / 1000).toFixed(1)}s`
  }
  
  if (duration < 3600000) {
    return `${(duration / 60000).toFixed(1)}m`
  }
  
  return `${(duration / 3600000).toFixed(1)}h`
}

/**
 * Generate unique execution ID
 */
export function generateExecutionId(): string {
  return `exec_${Date.now()}_${Math.random().toString(36).substring(2)}`
}

/**
 * Generate simple ID
 */
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

/**
 * Sanitize workflow input data
 */
export function sanitizeWorkflowInput(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(data)) {
    // Remove potentially dangerous fields
    if (key.startsWith('__') || key === 'constructor' || key === 'prototype') {
      continue
    }
    
    if (typeof value === 'string') {
      // Basic XSS protection
      sanitized[key] = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeWorkflowInput(value)
    } else {
      sanitized[key] = value
    }
  }
  
  return sanitized
}

/**
 * Extract key metrics from workflow results
 */
export function extractWorkflowMetrics(result: any): Record<string, number | string> {
  const metrics: Record<string, number | string> = {}
  
  if (result && typeof result === 'object') {
    // Extract common metrics
    if (result.processingTime) metrics.processingTime = result.processingTime
    if (result.executionId) metrics.executionId = result.executionId
    if (result.status) metrics.status = result.status
    
    // Extract specific metrics based on result type
    if (result.results && Array.isArray(result.results)) {
      metrics.resultCount = result.results.length
      
      // News analysis specific metrics
      if (result.results[0]?.sentiment) {
        const sentiments = result.results.map((r: any) => r.sentiment?.score || 0)
        metrics.avgSentiment = sentiments.reduce((sum: number, score: number) => sum + score, 0) / sentiments.length
      }
    }
    
    if (result.alerts && Array.isArray(result.alerts)) {
      metrics.alertCount = result.alerts.length
      const severities = result.alerts.map((a: any) => a.severity)
      metrics.criticalAlerts = severities.filter((s: string) => s === 'critical').length
    }
  }
  
  return metrics
}