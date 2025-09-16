/**
 * Extended Clerk authentication utilities for backend operations
 */

import { currentUser } from '@clerk/nextjs/server'
import { User } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'

/**
 * Get current authenticated user with extended info
 */
export async function getCurrentUser(): Promise<{
  clerkUser: User | null
  dbUser: any | null
  isAuthenticated: boolean
}> {
  try {
    const clerkUser = await currentUser()
    
    if (!clerkUser) {
      return {
        clerkUser: null,
        dbUser: null,
        isAuthenticated: false
      }
    }

    // Get or create user in database
    const dbUser = await prisma.user.upsert({
      where: {
        clerkUserId: clerkUser.id
      },
      update: {
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
        imageUrl: clerkUser.imageUrl || '',
        updatedAt: new Date()
      },
      create: {
        clerkUserId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
        imageUrl: clerkUser.imageUrl || '',
        role: 'USER', // Default role
        status: 'ACTIVE'
      }
    })

    return {
      clerkUser,
      dbUser,
      isAuthenticated: true
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    return {
      clerkUser: null,
      dbUser: null,
      isAuthenticated: false
    }
  }
}

/**
 * Get user ID from request (for API routes)
 */
export async function getUserIdFromRequest(): Promise<string | null> {
  try {
    const user = await currentUser()
    return user?.id || null
  } catch (error) {
    console.error('Error getting user ID from request:', error)
    return null
  }
}

/**
 * Verify user authentication and get user data
 */
export async function verifyAuthentication(): Promise<{
  success: boolean
  userId?: string
  dbUserId?: number
  user?: any
  error?: string
}> {
  try {
    const clerkUser = await currentUser()
    
    if (!clerkUser) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    const userId = clerkUser.id

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: {
        clerkUserId: userId
      }
    })

    if (!dbUser) {
      return {
        success: false,
        error: 'User not found in database'
      }
    }

    if (dbUser.status !== 'ACTIVE') {
      return {
        success: false,
        error: 'User account is not active'
      }
    }

    return {
      success: true,
      userId,
      dbUserId: dbUser.id,
      user: dbUser
    }
  } catch (error) {
    console.error('Error verifying authentication:', error)
    return {
      success: false,
      error: 'Authentication verification failed'
    }
  }
}

/**
 * Check if user has specific role
 */
export async function hasRole(requiredRole: string): Promise<boolean> {
  try {
    const { user } = await verifyAuthentication()
    
    if (!user) return false
    
    // Admin has access to everything
    if (user.role === 'ADMIN') return true
    
    return user.role === requiredRole
  } catch (error) {
    console.error('Error checking user role:', error)
    return false
  }
}

/**
 * Check if user has any of the specified roles
 */
export async function hasAnyRole(roles: string[]): Promise<boolean> {
  try {
    const { user } = await verifyAuthentication()
    
    if (!user) return false
    
    // Admin has access to everything
    if (user.role === 'ADMIN') return true
    
    return roles.includes(user.role)
  } catch (error) {
    console.error('Error checking user roles:', error)
    return false
  }
}

/**
 * Require authentication middleware
 */
export async function requireAuth(): Promise<{
  success: boolean
  userId?: string
  dbUserId?: number
  user?: any
  error?: string
}> {
  const authResult = await verifyAuthentication()
  
  if (!authResult.success) {
    throw new AuthenticationError(authResult.error || 'Authentication required')
  }
  
  return authResult
}

/**
 * Require specific role middleware
 */
export async function requireRole(requiredRole: string): Promise<{
  success: boolean
  userId?: string
  dbUserId?: number
  user?: any
  error?: string
}> {
  const authResult = await requireAuth()
  
  const hasRequiredRole = await hasRole(requiredRole)
  if (!hasRequiredRole) {
    throw new AuthorizationError(`Role '${requiredRole}' required`)
  }
  
  return authResult
}

/**
 * Get user subscription status
 */
export async function getUserSubscription(userId?: string): Promise<{
  hasSubscription: boolean
  plan?: string
  status?: string
  expiresAt?: Date
  features?: string[]
}> {
  try {
    const targetUserId = userId || (await getUserIdFromRequest())
    
    if (!targetUserId) {
      return { hasSubscription: false }
    }

    const user = await prisma.user.findUnique({
      where: {
        clerkUserId: targetUserId
      },
      include: {
        subscription: true
      }
    })

    if (!user?.subscription) {
      return { hasSubscription: false }
    }

    const subscription = user.subscription
    const isActive = subscription.status === 'ACTIVE' && 
                    (!subscription.expiresAt || subscription.expiresAt > new Date())

    return {
      hasSubscription: isActive,
      plan: subscription.plan,
      status: subscription.status,
      expiresAt: subscription.expiresAt,
      features: subscription.features as string[] || []
    }
  } catch (error) {
    console.error('Error getting user subscription:', error)
    return { hasSubscription: false }
  }
}

/**
 * Check if user has access to specific feature
 */
export async function hasFeatureAccess(feature: string): Promise<boolean> {
  try {
    const subscription = await getUserSubscription()
    
    if (!subscription.hasSubscription) {
      // Check if it's a free feature
      const freeFeatures = [
        'basic_portfolio',
        'basic_strategies',
        'basic_backtesting'
      ]
      return freeFeatures.includes(feature)
    }
    
    return subscription.features?.includes(feature) || false
  } catch (error) {
    console.error('Error checking feature access:', error)
    return false
  }
}

/**
 * Get user's API rate limits
 */
export async function getUserRateLimits(): Promise<{
  requestsPerMinute: number
  requestsPerHour: number
  requestsPerDay: number
  concurrentRequests: number
}> {
  try {
    const subscription = await getUserSubscription()
    
    // Default limits for free users
    let limits = {
      requestsPerMinute: 10,
      requestsPerHour: 100,
      requestsPerDay: 1000,
      concurrentRequests: 2
    }
    
    // Upgrade limits based on subscription
    if (subscription.hasSubscription) {
      switch (subscription.plan) {
        case 'PRO':
          limits = {
            requestsPerMinute: 60,
            requestsPerHour: 1000,
            requestsPerDay: 10000,
            concurrentRequests: 5
          }
          break
        case 'PREMIUM':
          limits = {
            requestsPerMinute: 200,
            requestsPerHour: 5000,
            requestsPerDay: 50000,
            concurrentRequests: 10
          }
          break
      }
    }
    
    return limits
  } catch (error) {
    console.error('Error getting user rate limits:', error)
    // Return most restrictive limits on error
    return {
      requestsPerMinute: 5,
      requestsPerHour: 50,
      requestsPerDay: 500,
      concurrentRequests: 1
    }
  }
}

/**
 * Log user activity
 */
export async function logUserActivity(activity: {
  action: string
  resource?: string
  resourceId?: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}): Promise<void> {
  try {
    const { dbUserId } = await verifyAuthentication()
    
    if (!dbUserId) return

    await prisma.auditLog.create({
      data: {
        userId: dbUserId,
        action: activity.action,
        resource: activity.resource,
        resourceId: activity.resourceId,
        metadata: activity.metadata || {},
        ipAddress: activity.ipAddress,
        userAgent: activity.userAgent,
        timestamp: new Date()
      }
    })
  } catch (error) {
    console.error('Error logging user activity:', error)
  }
}

/**
 * Get user preferences
 */
export async function getUserPreferences(userId?: string): Promise<Record<string, any>> {
  try {
    const targetUserId = userId || (await getUserIdFromRequest())
    
    if (!targetUserId) {
      return {}
    }

    const user = await prisma.user.findUnique({
      where: {
        clerkUserId: targetUserId
      },
      select: {
        preferences: true
      }
    })

    return (user?.preferences as Record<string, any>) || {}
  } catch (error) {
    console.error('Error getting user preferences:', error)
    return {}
  }
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  preferences: Record<string, any>,
  userId?: string
): Promise<boolean> {
  try {
    const targetUserId = userId || (await getUserIdFromRequest())
    
    if (!targetUserId) {
      return false
    }

    await prisma.user.update({
      where: {
        clerkUserId: targetUserId
      },
      data: {
        preferences: preferences,
        updatedAt: new Date()
      }
    })

    return true
  } catch (error) {
    console.error('Error updating user preferences:', error)
    return false
  }
}

/**
 * Check if user can access resource
 */
export async function canAccessResource(
  resourceType: string,
  resourceId: string,
  action: 'read' | 'write' | 'delete' = 'read'
): Promise<boolean> {
  try {
    const { user, dbUserId } = await verifyAuthentication()
    
    if (!user || !dbUserId) return false
    
    // Admin can access everything
    if (user.role === 'ADMIN') return true
    
    // Check specific resource permissions
    switch (resourceType) {
      case 'strategy':
        const strategy = await prisma.strategy.findUnique({
          where: { id: parseInt(resourceId) }
        })
        return strategy?.userId === dbUserId
        
      case 'backtest':
        const backtest = await prisma.backtest.findUnique({
          where: { id: parseInt(resourceId) },
          include: { strategy: true }
        })
        return backtest?.strategy.userId === dbUserId
        
      case 'portfolio':
        // Users can only access their own portfolio
        return true // Will be filtered by userId in queries
        
      default:
        return false
    }
  } catch (error) {
    console.error('Error checking resource access:', error)
    return false
  }
}

/**
 * Custom authentication error
 */
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthenticationError'
  }
}

/**
 * Custom authorization error
 */
export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthorizationError'
  }
}

/**
 * API route authentication wrapper
 */
export function withAuth(handler: (req: NextRequest, auth: any) => Promise<Response>) {
  return async (req: NextRequest): Promise<Response> => {
    try {
      const authResult = await requireAuth()
      
      // Log the API request
      await logUserActivity({
        action: 'api_request',
        resource: req.nextUrl.pathname,
        metadata: {
          method: req.method,
          query: Object.fromEntries(req.nextUrl.searchParams)
        },
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
        userAgent: req.headers.get('user-agent') || undefined
      })
      
      return await handler(req, authResult)
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return new Response(
          JSON.stringify({ error: 'Authentication required' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }
      
      if (error instanceof AuthorizationError) {
        return new Response(
          JSON.stringify({ error: 'Insufficient permissions' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      }
      
      console.error('Auth wrapper error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }
}

/**
 * API route role-based authentication wrapper
 */
export function withRole(requiredRole: string) {
  return function(handler: (req: NextRequest, auth: any) => Promise<Response>) {
    return async (req: NextRequest): Promise<Response> => {
      try {
        const authResult = await requireRole(requiredRole)
        
        // Log the API request
        await logUserActivity({
          action: 'api_request',
          resource: req.nextUrl.pathname,
          metadata: {
            method: req.method,
            query: Object.fromEntries(req.nextUrl.searchParams),
            requiredRole
          },
          ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
          userAgent: req.headers.get('user-agent') || undefined
        })
        
        return await handler(req, authResult)
      } catch (error) {
        if (error instanceof AuthenticationError) {
          return new Response(
            JSON.stringify({ error: 'Authentication required' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          )
        }
        
        if (error instanceof AuthorizationError) {
          return new Response(
            JSON.stringify({ error: 'Insufficient permissions' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          )
        }
        
        console.error('Role auth wrapper error:', error)
        return new Response(
          JSON.stringify({ error: 'Internal server error' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }
  }
}