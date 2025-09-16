/**
 * Railway API Client
 * 
 * This client handles communication with Railway API for infrastructure monitoring,
 * deployment management, and resource tracking
 */

import { 
  RailwayProject, 
  RailwayService, 
  RailwayDeployment, 
  RailwayMetrics,
  RailwayEnvironment,
  RailwayUsage,
  RailwayIncident
} from './types'

export class RailwayApiClient {
  private baseUrl: string = 'https://backboard.railway.app/graphql'
  private apiToken: string
  private timeout: number

  constructor(apiToken: string = process.env.RAILWAY_API_TOKEN || '', timeout: number = 30000) {
    this.apiToken = apiToken
    this.timeout = timeout
  }

  /**
   * Execute GraphQL query
   */
  private async graphqlQuery(query: string, variables?: Record<string, any>): Promise<any> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiToken}`,
        },
        body: JSON.stringify({
          query,
          variables,
        }),
        signal: AbortSignal.timeout(this.timeout),
      })

      if (!response.ok) {
        throw new RailwayError(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.errors) {
        throw new RailwayError(`GraphQL Error: ${data.errors.map((e: any) => e.message).join(', ')}`)
      }

      return data.data
    } catch (error) {
      if (error instanceof RailwayError) {
        throw error
      }
      throw new RailwayError(`Failed to execute GraphQL query: ${this.getErrorMessage(error)}`)
    }
  }

  /**
   * Get all projects
   */
  async getProjects(): Promise<RailwayProject[]> {
    const query = `
      query GetProjects {
        projects {
          edges {
            node {
              id
              name
              description
              createdAt
              updatedAt
              environments {
                edges {
                  node {
                    id
                    name
                    isProduction
                  }
                }
              }
            }
          }
        }
      }
    `

    try {
      const data = await this.graphqlQuery(query)
      return data.projects.edges.map((edge: any) => ({
        id: edge.node.id,
        name: edge.node.name,
        description: edge.node.description || '',
        createdAt: edge.node.createdAt,
        updatedAt: edge.node.updatedAt,
        environments: edge.node.environments.edges.map((envEdge: any) => ({
          id: envEdge.node.id,
          name: envEdge.node.name,
          isProduction: envEdge.node.isProduction,
        })),
      }))
    } catch (error) {
      throw new RailwayError(`Failed to get projects: ${this.getErrorMessage(error)}`)
    }
  }

  /**
   * Get project services
   */
  async getProjectServices(projectId: string): Promise<RailwayService[]> {
    const query = `
      query GetProjectServices($projectId: String!) {
        project(id: $projectId) {
          services {
            edges {
              node {
                id
                name
                icon
                createdAt
                updatedAt
                deployments {
                  edges {
                    node {
                      id
                      status
                      createdAt
                      url
                    }
                  }
                }
              }
            }
          }
        }
      }
    `

    try {
      const data = await this.graphqlQuery(query, { projectId })
      
      if (!data.project) {
        throw new RailwayError(`Project ${projectId} not found`)
      }

      return data.project.services.edges.map((edge: any) => ({
        id: edge.node.id,
        name: edge.node.name,
        icon: edge.node.icon,
        createdAt: edge.node.createdAt,
        updatedAt: edge.node.updatedAt,
        deployments: edge.node.deployments.edges.map((depEdge: any) => ({
          id: depEdge.node.id,
          status: depEdge.node.status,
          createdAt: depEdge.node.createdAt,
          url: depEdge.node.url,
        })),
      }))
    } catch (error) {
      throw new RailwayError(`Failed to get project services: ${this.getErrorMessage(error)}`)
    }
  }

  /**
   * Get service deployments
   */
  async getServiceDeployments(serviceId: string, limit = 10): Promise<RailwayDeployment[]> {
    const query = `
      query GetServiceDeployments($serviceId: String!, $first: Int) {
        service(id: $serviceId) {
          deployments(first: $first, orderBy: { createdAt: DESC }) {
            edges {
              node {
                id
                status
                createdAt
                updatedAt
                url
                meta
                canRedeploy
                canRollback
                staticUrl
              }
            }
          }
        }
      }
    `

    try {
      const data = await this.graphqlQuery(query, { serviceId, first: limit })
      
      if (!data.service) {
        throw new RailwayError(`Service ${serviceId} not found`)
      }

      return data.service.deployments.edges.map((edge: any) => ({
        id: edge.node.id,
        serviceId,
        status: edge.node.status,
        createdAt: edge.node.createdAt,
        updatedAt: edge.node.updatedAt,
        url: edge.node.url,
        staticUrl: edge.node.staticUrl,
        meta: edge.node.meta || {},
        canRedeploy: edge.node.canRedeploy,
        canRollback: edge.node.canRollback,
      }))
    } catch (error) {
      throw new RailwayError(`Failed to get service deployments: ${this.getErrorMessage(error)}`)
    }
  }

  /**
   * Get deployment logs
   */
  async getDeploymentLogs(deploymentId: string, limit = 100): Promise<Array<{
    timestamp: string
    message: string
    severity: 'info' | 'warn' | 'error'
  }>> {
    const query = `
      query GetDeploymentLogs($deploymentId: String!, $first: Int) {
        deployment(id: $deploymentId) {
          logs(first: $first) {
            edges {
              node {
                timestamp
                message
                severity
              }
            }
          }
        }
      }
    `

    try {
      const data = await this.graphqlQuery(query, { deploymentId, first: limit })
      
      if (!data.deployment) {
        throw new RailwayError(`Deployment ${deploymentId} not found`)
      }

      return data.deployment.logs.edges.map((edge: any) => ({
        timestamp: edge.node.timestamp,
        message: edge.node.message,
        severity: edge.node.severity || 'info',
      }))
    } catch (error) {
      throw new RailwayError(`Failed to get deployment logs: ${this.getErrorMessage(error)}`)
    }
  }

  /**
   * Get service metrics
   */
  async getServiceMetrics(serviceId: string, timeRange = '1h'): Promise<RailwayMetrics> {
    const query = `
      query GetServiceMetrics($serviceId: String!, $timeRange: String!) {
        service(id: $serviceId) {
          metrics(timeRange: $timeRange) {
            cpu {
              timestamps
              values
            }
            memory {
              timestamps
              values
            }
            network {
              timestamps
              values
            }
          }
        }
      }
    `

    try {
      const data = await this.graphqlQuery(query, { serviceId, timeRange })
      
      if (!data.service) {
        throw new RailwayError(`Service ${serviceId} not found`)
      }

      const metrics = data.service.metrics || {}
      
      return {
        cpu: {
          timestamps: metrics.cpu?.timestamps || [],
          values: metrics.cpu?.values || [],
        },
        memory: {
          timestamps: metrics.memory?.timestamps || [],
          values: metrics.memory?.values || [],
        },
        network: {
          timestamps: metrics.network?.timestamps || [],
          values: metrics.network?.values || [],
        },
      }
    } catch (error) {
      throw new RailwayError(`Failed to get service metrics: ${this.getErrorMessage(error)}`)
    }
  }

  /**
   * Get project usage
   */
  async getProjectUsage(projectId: string): Promise<RailwayUsage> {
    const query = `
      query GetProjectUsage($projectId: String!) {
        project(id: $projectId) {
          usage {
            current {
              cpuHours
              memoryGbHours
              networkGb
              diskGbHours
            }
            estimated {
              cpuHours
              memoryGbHours
              networkGb
              diskGbHours
            }
            subscription {
              plan
              billingPeriodStart
              billingPeriodEnd
            }
          }
        }
      }
    `

    try {
      const data = await this.graphqlQuery(query, { projectId })
      
      if (!data.project) {
        throw new RailwayError(`Project ${projectId} not found`)
      }

      const usage = data.project.usage || {}
      
      return {
        current: {
          cpuHours: usage.current?.cpuHours || 0,
          memoryGbHours: usage.current?.memoryGbHours || 0,
          networkGb: usage.current?.networkGb || 0,
          diskGbHours: usage.current?.diskGbHours || 0,
        },
        estimated: {
          cpuHours: usage.estimated?.cpuHours || 0,
          memoryGbHours: usage.estimated?.memoryGbHours || 0,
          networkGb: usage.estimated?.networkGb || 0,
          diskGbHours: usage.estimated?.diskGbHours || 0,
        },
        subscription: {
          plan: usage.subscription?.plan || 'hobby',
          billingPeriodStart: usage.subscription?.billingPeriodStart,
          billingPeriodEnd: usage.subscription?.billingPeriodEnd,
        },
      }
    } catch (error) {
      throw new RailwayError(`Failed to get project usage: ${this.getErrorMessage(error)}`)
    }
  }

  /**
   * Redeploy a service
   */
  async redeployService(serviceId: string): Promise<{ deploymentId: string; status: string }> {
    const mutation = `
      mutation RedeployService($serviceId: String!) {
        serviceRedeploy(serviceId: $serviceId) {
          id
          status
        }
      }
    `

    try {
      const data = await this.graphqlQuery(mutation, { serviceId })
      
      if (!data.serviceRedeploy) {
        throw new RailwayError('Failed to trigger redeploy')
      }

      return {
        deploymentId: data.serviceRedeploy.id,
        status: data.serviceRedeploy.status,
      }
    } catch (error) {
      throw new RailwayError(`Failed to redeploy service: ${this.getErrorMessage(error)}`)
    }
  }

  /**
   * Get incident status
   */
  async getIncidents(): Promise<RailwayIncident[]> {
    // Railway doesn't have a public incidents API, so we'll fetch from status page
    try {
      const response = await fetch('https://status.railway.app/api/v2/incidents.json', {
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(this.timeout),
      })

      if (!response.ok) {
        throw new RailwayError(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      return (data.incidents || []).map((incident: any) => ({
        id: incident.id,
        name: incident.name,
        status: incident.status,
        impact: incident.impact,
        createdAt: incident.created_at,
        updatedAt: incident.updated_at,
        resolvedAt: incident.resolved_at,
        shortlink: incident.shortlink,
        components: incident.components || [],
        updates: incident.incident_updates || [],
      }))
    } catch (error) {
      throw new RailwayError(`Failed to get incidents: ${this.getErrorMessage(error)}`)
    }
  }

  /**
   * Test Railway connection
   */
  async testConnection(): Promise<{ 
    success: boolean 
    message: string 
    latency?: number 
    user?: string 
  }> {
    const query = `
      query TestConnection {
        me {
          id
          name
          email
        }
      }
    `

    try {
      const start = Date.now()
      const data = await this.graphqlQuery(query)
      const latency = Date.now() - start
      
      return {
        success: true,
        message: 'Connected successfully',
        latency,
        user: data.me?.name || data.me?.email || 'Unknown',
      }
    } catch (error) {
      return {
        success: false,
        message: this.getErrorMessage(error),
      }
    }
  }

  /**
   * Get comprehensive infrastructure status
   */
  async getInfrastructureStatus(): Promise<{
    projects: number
    activeServices: number
    healthyDeployments: number
    totalDeployments: number
    currentUsage: RailwayUsage['current']
    recentIncidents: number
    overallHealth: 'healthy' | 'degraded' | 'unhealthy'
  }> {
    try {
      const [projects, incidents] = await Promise.all([
        this.getProjects(),
        this.getIncidents().catch(() => []), // Don't fail if incidents can't be fetched
      ])

      let totalServices = 0
      let totalDeployments = 0
      let healthyDeployments = 0
      let totalUsage = { cpuHours: 0, memoryGbHours: 0, networkGb: 0, diskGbHours: 0 }

      // Aggregate data from all projects
      for (const project of projects) {
        try {
          const [services, usage] = await Promise.all([
            this.getProjectServices(project.id),
            this.getProjectUsage(project.id).catch(() => ({ current: { cpuHours: 0, memoryGbHours: 0, networkGb: 0, diskGbHours: 0 } })),
          ])

          totalServices += services.length

          for (const service of services) {
            const deployments = service.deployments || []
            totalDeployments += deployments.length
            healthyDeployments += deployments.filter(d => d.status === 'SUCCESS').length
          }

          // Aggregate usage
          totalUsage.cpuHours += usage.current.cpuHours
          totalUsage.memoryGbHours += usage.current.memoryGbHours
          totalUsage.networkGb += usage.current.networkGb
          totalUsage.diskGbHours += usage.current.diskGbHours
        } catch (error) {
          // Continue with other projects if one fails
          console.warn(`Failed to get data for project ${project.id}:`, error)
        }
      }

      const recentIncidents = incidents.filter(incident => 
        new Date(incident.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      ).length

      // Determine overall health
      let overallHealth: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
      
      if (recentIncidents > 0) {
        overallHealth = 'degraded'
      }
      
      const healthyRatio = totalDeployments > 0 ? healthyDeployments / totalDeployments : 1
      if (healthyRatio < 0.8) {
        overallHealth = 'unhealthy'
      } else if (healthyRatio < 0.95) {
        overallHealth = 'degraded'
      }

      return {
        projects: projects.length,
        activeServices: totalServices,
        healthyDeployments,
        totalDeployments,
        currentUsage: totalUsage,
        recentIncidents,
        overallHealth,
      }
    } catch (error) {
      throw new RailwayError(`Failed to get infrastructure status: ${this.getErrorMessage(error)}`)
    }
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
 * Custom error class for Railway-related errors
 */
export class RailwayError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message)
    this.name = 'RailwayError'
    
    if (originalError) {
      this.cause = originalError
    }
  }
}

// Export singleton instance
export const railwayService = new RailwayApiClient()