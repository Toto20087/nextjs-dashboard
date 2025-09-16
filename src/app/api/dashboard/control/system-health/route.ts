import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  let dbUser;
  let user;
  try {
    if (
      !(
        process.env.NODE_ENV === "development" &&
        process.env.ACCESS_AUTHORIZATION_KEY
      )
    ) {
      const user = await currentUser();

      if (!user) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "UNAUTHORIZED", message: "Authentication required" },
          },
          { status: 401 }
        );
      }
    }

    if (process.env.NODE_ENV === "development") {
      dbUser = {
        role: "admin",
        can_override_risk: true,
      };
    } else {
      dbUser = await prisma.users.findUnique({
        where: {
          clerk_user_id: user.id,
          is_active: true,
        },
        select: {
          role: true,
          can_override_risk: true,
        },
      });
    }
    // Check if user has admin role

    if (
      !dbUser ||
      (dbUser.role !== "admin" &&
        dbUser.role !== "super_admin" &&
        !dbUser.can_override_risk)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Admin access required for system health monitoring",
          },
        },
        { status: 403 }
      );
    }

    // Get Railway infrastructure status
    const railwayHealth = await getRailwayHealth();

    // Get database health
    const databaseHealth = await getDatabaseHealth();

    return NextResponse.json({
      success: true,
      data: {
        infrastructure: {
          database: databaseHealth,
          railway: railwayHealth,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("System health API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SYSTEM_HEALTH_ERROR",
          message: "Failed to fetch system health data",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}

// Railway API GraphQL client
async function railwayGraphQLRequest(query: string, variables: any = {}) {
  const railwayToken = process.env.RAILWAY_API_KEY;

  if (!railwayToken) {
    throw new Error("RAILWAY_API_KEY environment variable not configured");
  }

  try {
    const response = await fetch("https://backboard.railway.com/graphql/v2", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${railwayToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Railway API HTTP ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();

    if (data.errors) {
      throw new Error(`Railway GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    return data.data;
  } catch (error) {
    // Don't throw error, let caller handle it gracefully
    console.error("Railway API request failed:", error);
    throw error;
  }
}

// Get Railway deployment and infrastructure health
async function getRailwayHealth() {
  try {
    // Get project environments and their deployment status
    const query = `
      query GetProjectHealth {
        me {
          projects(first: 10) {
            edges {
              node {
                id
                name
                environments(first: 5) {
                  edges {
                    node {
                      id
                      name
                      serviceInstances(first: 10) {
                        edges {
                          node {
                            serviceName
                            latestDeployment {
                              id
                              status
                              createdAt
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const data = await railwayGraphQLRequest(query);

    if (!data.me?.projects?.edges) {
      return {
        status: "unknown",
        error: "No projects found in Railway account",
        projects: [],
        summary: {
          totalServices: 0,
          healthyServices: 0,
          deployingServices: 0,
          failedServices: 0,
          healthPercentage: 0,
        },
      };
    }

    const projects = data.me.projects.edges.map((projectEdge: any) => {
      const project = projectEdge.node;
      const environments = project.environments?.edges || [];

      return {
        id: project.id,
        name: project.name,
        environments: environments.map((envEdge: any) => {
          const env = envEdge.node;
          const services = env.serviceInstances?.edges || [];

          return {
            id: env.id,
            name: env.name,
            services: services.map((serviceEdge: any) => {
              const service = serviceEdge.node;
              const deployment = service.latestDeployment;

              return {
                name: service.serviceName,
                deploymentId: deployment?.id,
                status: deployment?.status || "UNKNOWN",
                lastDeployed: deployment?.createdAt,
                isHealthy: ["ACTIVE", "SUCCESS"].includes(deployment?.status),
              };
            }),
          };
        }),
      };
    });

    // Calculate overall health statistics
    let totalServices = 0;
    let healthyServices = 0;
    let deployingServices = 0;
    let failedServices = 0;

    projects.forEach((project) => {
      project.environments.forEach((env: any) => {
        env.services.forEach((service: any) => {
          totalServices++;
          if (service.isHealthy) healthyServices++;
          else if (service.status === "DEPLOYING") deployingServices++;
          else if (["FAILED", "CRASHED"].includes(service.status))
            failedServices++;
        });
      });
    });

    const overallStatus =
      failedServices > 0
        ? "critical"
        : deployingServices > 0
        ? "deploying"
        : healthyServices === totalServices
        ? "healthy"
        : "warning";

    return {
      status: overallStatus,
      projects,
      summary: {
        totalServices,
        healthyServices,
        deployingServices,
        failedServices,
        healthPercentage:
          totalServices > 0 ? (healthyServices / totalServices) * 100 : 0,
      },
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Railway health check failed:", error);
    return {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
      projects: [],
      summary: {
        totalServices: 0,
        healthyServices: 0,
        deployingServices: 0,
        failedServices: 0,
        healthPercentage: 0,
      },
    };
  }
}

// Get database connection health
async function getDatabaseHealth() {
  try {
    const start = Date.now();

    // Simple connectivity test
    await prisma.$queryRaw`SELECT 1 as health_check`;

    const responseTime = Date.now() - start;

    // Get connection pool info if available (skip if metrics not enabled)
    let metrics = null;
    try {
      metrics = await prisma.$metrics.json();
    } catch (metricsError) {
      // Metrics feature not enabled, continue without it
      console.log("Prisma metrics not available:", metricsError);
    }

    return {
      status: "healthy",
      responseTime,
      connections: {
        active: metrics?.counters?.find(
          (c: any) => c.key === "db.client.connections.active"
        )?.value || 0,
        idle: metrics?.counters?.find(
          (c: any) => c.key === "db.client.connections.idle"
        )?.value || 0,
      },
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Database health check failed:", error);
    return {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
      responseTime: null,
      connections: {
        active: 0,
        idle: 0,
      },
      lastChecked: new Date().toISOString(),
    };
  }
}
