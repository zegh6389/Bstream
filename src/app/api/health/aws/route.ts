import { NextResponse } from 'next/server'
import { checkAWSServices, validateAWSEnvironment } from '@/lib/aws-config'
import { testRedisConnection } from '@/lib/redis-aws'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Validate environment variables
    const envValidation = validateAWSEnvironment()
    
    // Test database connection
    let dbStatus: any = { status: 'error', error: 'Unknown' }
    try {
      await db.$connect()
      await db.$queryRaw`SELECT 1`
      dbStatus = { status: 'connected', type: 'postgresql' }
    } catch (error) {
      dbStatus = { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Database connection failed' 
      }
    } finally {
      await db.$disconnect()
    }

    // Test Redis connection
    const redisStatus = await testRedisConnection()

    // Check AWS services (if configured)
    let awsStatus: any = { status: 'not_configured' }
    if (envValidation.isValid) {
      try {
        awsStatus = await checkAWSServices()
      } catch (error) {
        awsStatus = { 
          status: 'error', 
          error: error instanceof Error ? error.message : 'AWS services check failed' 
        }
      }
    }

    const overallStatus = 
      dbStatus.status === 'connected' && 
      redisStatus.success && 
      (awsStatus.status === 'not_configured' || awsStatus.database?.status === 'available')
        ? 'healthy' 
        : 'unhealthy'

    return NextResponse.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      environment: {
        validation: envValidation,
        nodeEnv: process.env.NODE_ENV,
        region: process.env.AWS_REGION
      },
      services: {
        database: dbStatus,
        redis: redisStatus,
        aws: awsStatus
      }
    })

  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Health check failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
