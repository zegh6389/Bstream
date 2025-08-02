import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds'
import { ElastiCacheClient, DescribeCacheClustersCommand } from '@aws-sdk/client-elasticache'
import { SSMClient, GetParameterCommand, PutParameterCommand } from '@aws-sdk/client-ssm'

const AWS_REGION = process.env.AWS_REGION || 'us-east-1'

// Initialize AWS clients
export const rdsClient = new RDSClient({ 
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
})

export const elasticacheClient = new ElastiCacheClient({ 
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
})

export const ssmClient = new SSMClient({ 
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
})

/**
 * Check RDS database connection status
 */
export async function checkDatabaseConnection(): Promise<{
  status: 'available' | 'unavailable' | 'error'
  endpoint?: string
  engine?: string
  error?: string
}> {
  try {
    const command = new DescribeDBInstancesCommand({})
    const response = await rdsClient.send(command)
    
    const dbInstance = response.DBInstances?.[0]
    if (dbInstance) {
      return {
        status: dbInstance.DBInstanceStatus === 'available' ? 'available' : 'unavailable',
        endpoint: dbInstance.Endpoint?.Address,
        engine: dbInstance.Engine
      }
    }
    
    return { status: 'unavailable', error: 'No database instances found' }
  } catch (error) {
    console.error('Database connection check failed:', error)
    return { 
      status: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Check ElastiCache Redis connection status
 */
export async function checkRedisConnection(): Promise<{
  status: 'available' | 'unavailable' | 'error'
  endpoint?: string
  engine?: string
  error?: string
}> {
  try {
    const command = new DescribeCacheClustersCommand({})
    const response = await elasticacheClient.send(command)
    
    const cacheCluster = response.CacheClusters?.[0]
    if (cacheCluster) {
      return {
        status: cacheCluster.CacheClusterStatus === 'available' ? 'available' : 'unavailable',
        endpoint: cacheCluster.RedisConfiguration?.PrimaryEndpoint?.Address || 
                 cacheCluster.CacheNodes?.[0]?.Endpoint?.Address,
        engine: cacheCluster.Engine
      }
    }
    
    return { status: 'unavailable', error: 'No cache clusters found' }
  } catch (error) {
    console.error('Redis connection check failed:', error)
    return { 
      status: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get secure parameter from AWS Systems Manager Parameter Store
 */
export async function getSecureParameter(name: string): Promise<string | null> {
  try {
    const command = new GetParameterCommand({
      Name: name,
      WithDecryption: true
    })
    
    const response = await ssmClient.send(command)
    return response.Parameter?.Value || null
  } catch (error) {
    console.error(`Failed to get parameter ${name}:`, error)
    return null
  }
}

/**
 * Store secure parameter in AWS Systems Manager Parameter Store
 */
export async function putSecureParameter(
  name: string, 
  value: string, 
  description?: string
): Promise<boolean> {
  try {
    const command = new PutParameterCommand({
      Name: name,
      Value: value,
      Type: 'SecureString',
      Description: description,
      Overwrite: true
    })
    
    await ssmClient.send(command)
    return true
  } catch (error) {
    console.error(`Failed to store parameter ${name}:`, error)
    return false
  }
}

/**
 * AWS health check for all services
 */
export async function checkAWSServices() {
  const [dbStatus, redisStatus] = await Promise.all([
    checkDatabaseConnection(),
    checkRedisConnection()
  ])

  return {
    database: dbStatus,
    redis: redisStatus,
    timestamp: new Date().toISOString(),
    region: AWS_REGION
  }
}

/**
 * Environment validation for AWS services
 */
export function validateAWSEnvironment(): {
  isValid: boolean
  missingVars: string[]
  warnings: string[]
} {
  const required = [
    'AWS_REGION',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'DATABASE_URL'
  ]

  const optional = [
    'REDIS_URL',
    'AWS_S3_BUCKET',
    'AWS_SES_REGION'
  ]

  const missingVars = required.filter(varName => !process.env[varName])
  const missingOptional = optional.filter(varName => !process.env[varName])

  return {
    isValid: missingVars.length === 0,
    missingVars,
    warnings: missingOptional.map(varName => `Optional variable ${varName} is not set`)
  }
}
