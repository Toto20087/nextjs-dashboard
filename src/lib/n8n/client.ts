/**
 * N8N Workflow Client
 * 
 * This client handles communication with N8N workflows for automated news analysis
 * and other trading-related automation tasks
 */

import { N8NWorkflowRequest, N8NWorkflowResponse, N8NExecutionStatus, N8NExecutionResult } from './types'

export class N8NWorkflowClient {
  private baseUrl: string
  private apiKey: string
  private timeout: number

  constructor(baseUrl: string = process.env.N8N_BASE_URL || 'http://localhost:5678', apiKey: string = process.env.N8N_API_KEY || '', timeout: number = 30000) {
    this.baseUrl = baseUrl.replace(/\/+$/, '') // Remove trailing slashes
    this.apiKey = apiKey
    this.timeout = timeout
  }

  /**
   * Trigger a workflow execution
   */
  async triggerWorkflow(workflowId: string, data?: any): Promise<N8NWorkflowResponse> {
    try {
      const response = await this.makeRequest(`/api/v1/workflows/${workflowId}/execute`, {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      })

      if (!response.ok) {
        throw new N8NError(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      throw new N8NError(`Failed to trigger workflow: ${this.getErrorMessage(error)}`)
    }
  }

  /**
   * Get workflow execution status
   */
  async getExecutionStatus(executionId: string): Promise<N8NExecutionStatus> {
    try {
      const response = await this.makeRequest(`/api/v1/executions/${executionId}`)

      if (!response.ok) {
        if (response.status === 404) {
          throw new N8NError(`Execution ${executionId} not found`)
        }
        throw new N8NError(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      throw new N8NError(`Failed to get execution status: ${this.getErrorMessage(error)}`)
    }
  }

  /**
   * Get workflow execution results
   */
  async getExecutionResults(executionId: string): Promise<N8NExecutionResult> {
    try {
      const response = await this.makeRequest(`/api/v1/executions/${executionId}/results`)

      if (!response.ok) {
        if (response.status === 404) {
          throw new N8NError(`Execution results for ${executionId} not found`)
        }
        throw new N8NError(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      throw new N8NError(`Failed to get execution results: ${this.getErrorMessage(error)}`)
    }
  }

  /**
   * Trigger news analysis workflow
   */
  async analyzeNews(articles: Array<{ title: string; content: string; url: string; publishedAt: string }>): Promise<N8NWorkflowResponse> {
    try {
      return await this.triggerWorkflow('news-analysis', {
        articles,
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId(),
      })
    } catch (error) {
      throw new N8NError(`Failed to trigger news analysis: ${this.getErrorMessage(error)}`)
    }
  }

  /**
   * Trigger market sentiment analysis workflow
   */
  async analyzeMarketSentiment(symbols: string[], timeframe = '1day'): Promise<N8NWorkflowResponse> {
    try {
      return await this.triggerWorkflow('market-sentiment', {
        symbols,
        timeframe,
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId(),
      })
    } catch (error) {
      throw new N8NError(`Failed to trigger market sentiment analysis: ${this.getErrorMessage(error)}`)
    }
  }

  /**
   * Trigger strategy performance alert workflow
   */
  async triggerPerformanceAlert(strategyId: string, performance: any): Promise<N8NWorkflowResponse> {
    try {
      return await this.triggerWorkflow('performance-alert', {
        strategyId,
        performance,
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId(),
      })
    } catch (error) {
      throw new N8NError(`Failed to trigger performance alert: ${this.getErrorMessage(error)}`)
    }
  }

  /**
   * Get list of available workflows
   */
  async getWorkflows(): Promise<Array<{
    id: string
    name: string
    active: boolean
    tags: string[]
    createdAt: string
    updatedAt: string
  }>> {
    try {
      const response = await this.makeRequest('/api/v1/workflows')

      if (!response.ok) {
        throw new N8NError(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data.data || []
    } catch (error) {
      throw new N8NError(`Failed to get workflows: ${this.getErrorMessage(error)}`)
    }
  }

  /**
   * Get execution history
   */
  async getExecutionHistory(params: {
    workflowId?: string
    status?: 'running' | 'success' | 'error' | 'canceled'
    limit?: number
    offset?: number
  } = {}): Promise<{
    executions: Array<{
      id: string
      workflowId: string
      status: string
      startedAt: string
      stoppedAt?: string
      error?: string
    }>
    pagination: {
      total: number
      limit: number
      offset: number
    }
  }> {
    try {
      const queryParams = new URLSearchParams()
      
      if (params.workflowId) queryParams.append('workflowId', params.workflowId)
      if (params.status) queryParams.append('status', params.status)
      if (params.limit) queryParams.append('limit', params.limit.toString())
      if (params.offset) queryParams.append('offset', params.offset.toString())

      const url = `/api/v1/executions${queryParams.toString() ? '?' + queryParams.toString() : ''}`
      const response = await this.makeRequest(url)

      if (!response.ok) {
        throw new N8NError(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      throw new N8NError(`Failed to get execution history: ${this.getErrorMessage(error)}`)
    }
  }

  /**
   * Test N8N connection
   */
  async testConnection(): Promise<{ 
    success: boolean 
    message: string 
    latency?: number 
    version?: string 
  }> {
    try {
      const start = Date.now()
      const response = await this.makeRequest('/api/v1/health')
      const latency = Date.now() - start

      if (!response.ok) {
        return {
          success: false,
          message: `HTTP ${response.status}: ${response.statusText}`,
        }
      }

      const data = await response.json()
      
      return {
        success: true,
        message: 'Connected successfully',
        latency,
        version: data.version || 'unknown',
      }
    } catch (error) {
      return {
        success: false,
        message: this.getErrorMessage(error),
      }
    }
  }

  /**
   * Poll for workflow completion
   */
  async pollForCompletion(
    executionId: string, 
    options: {
      interval?: number
      maxAttempts?: number
      onProgress?: (status: N8NExecutionStatus) => void
    } = {}
  ): Promise<N8NExecutionResult> {
    const { interval = 2000, maxAttempts = 60, onProgress } = options // Default: 2 minutes max
    
    let attempts = 0

    while (attempts < maxAttempts) {
      try {
        const status = await this.getExecutionStatus(executionId)
        
        if (onProgress) {
          onProgress(status)
        }

        if (status.status === 'success') {
          return await this.getExecutionResults(executionId)
        }

        if (status.status === 'error' || status.status === 'canceled') {
          throw new N8NError(`Workflow ${status.status}: ${status.error || 'Unknown error'}`)
        }

        await new Promise(resolve => setTimeout(resolve, interval))
        attempts++
      } catch (error) {
        if (error instanceof N8NError) {
          throw error
        }
        throw new N8NError(`Polling failed: ${this.getErrorMessage(error)}`)
      }
    }

    throw new N8NError('Workflow polling timeout - execution may still be running')
  }

  /**
   * Make HTTP request with timeout and error handling
   */
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(this.apiKey && { 'X-N8N-API-KEY': this.apiKey }),
          ...options.headers,
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout')
      }
      
      throw error
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2)}`
  }

  /**
   * Extract error message from various error types
   */
  private getErrorMessage(error: any): string {
    if (error instanceof Error) {
      return error.message
    }
    
    if (typeof error === 'string') {
      return error
    }
    
    return 'Unknown error occurred'
  }
}

/**
 * Custom error class for N8N-related errors
 */
export class N8NError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message)
    this.name = 'N8NError'
    
    if (originalError) {
      this.cause = originalError
    }
  }
}

// Export singleton instance
export const n8nService = new N8NWorkflowClient()