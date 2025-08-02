import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3"
import { checkAWSServices, validateAWSEnvironment } from '../src/lib/aws-config'
import { testRedisConnection } from '../src/lib/redis-aws'
import { db } from '../src/lib/db'

async function testAWSSetup() {
  console.log('🧪 Testing AWS Setup for Bstream\n')
  
  let allTestsPassed = true

  // Test 1: Environment Variables
  console.log('1️⃣ Testing Environment Variables...')
  const envValidation = validateAWSEnvironment()
  
  if (envValidation.isValid) {
    console.log('   ✅ All required environment variables are set')
  } else {
    console.log('   ❌ Missing environment variables:')
    envValidation.missingVars.forEach(varName => {
      console.log(`      - ${varName}`)
    })
    allTestsPassed = false
  }

  if (envValidation.warnings.length > 0) {
    console.log('   ⚠️ Warnings:')
    envValidation.warnings.forEach(warning => {
      console.log(`      - ${warning}`)
    })
  }

  // Test 2: Database Connection
  console.log('\n2️⃣ Testing Database Connection...')
  try {
    await db.$connect()
    const result = await db.$queryRaw`SELECT version()`
    console.log('   ✅ Database connection successful')
    console.log(`   📊 Database version: ${JSON.stringify(result)}`)
    await db.$disconnect()
  } catch (error) {
    console.log('   ❌ Database connection failed:')
    console.log(`      ${error instanceof Error ? error.message : 'Unknown error'}`)
    allTestsPassed = false
  }

  // Test 3: Redis Connection
  console.log('\n3️⃣ Testing Redis Connection...')
  const redisTest = await testRedisConnection()
  
  if (redisTest.success) {
    console.log('   ✅ Redis connection successful')
    console.log(`   ⚡ Latency: ${redisTest.latency}ms`)
  } else {
    console.log('   ❌ Redis connection failed:')
    console.log(`      ${redisTest.error}`)
    allTestsPassed = false
  }

  // Test 4: AWS Services (only if AWS is configured)
  if (envValidation.isValid && process.env.AWS_ACCESS_KEY_ID) {
    console.log('\n4️⃣ Testing AWS Services...')
    try {
      const awsStatus = await checkAWSServices()
      
      console.log(`   🌍 AWS Region: ${awsStatus.region}`)
      console.log(`   📅 Timestamp: ${awsStatus.timestamp}`)
      
      // Database status
      if (awsStatus.database.status === 'available') {
        console.log('   ✅ RDS Database: Available')
        console.log(`      Endpoint: ${awsStatus.database.endpoint}`)
        console.log(`      Engine: ${awsStatus.database.engine}`)
      } else {
        console.log(`   ❌ RDS Database: ${awsStatus.database.status}`)
        if (awsStatus.database.error) {
          console.log(`      Error: ${awsStatus.database.error}`)
        }
        allTestsPassed = false
      }
      
      // Redis status
      if (awsStatus.redis.status === 'available') {
        console.log('   ✅ ElastiCache Redis: Available')
        console.log(`      Endpoint: ${awsStatus.redis.endpoint}`)
        console.log(`      Engine: ${awsStatus.redis.engine}`)
      } else {
        console.log(`   ❌ ElastiCache Redis: ${awsStatus.redis.status}`)
        if (awsStatus.redis.error) {
          console.log(`      Error: ${awsStatus.redis.error}`)
        }
      }
      
    } catch (error) {
      console.log('   ⚠️ AWS services check failed (this is ok for local development):')
      console.log(`      ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  } else {
    console.log('\n4️⃣ Skipping AWS Services test (not configured or missing credentials)')
  }

  // Test 5: S3 Access (if configured)
  if (process.env.AWS_S3_BUCKET && process.env.AWS_ACCESS_KEY_ID) {
    console.log('\n5️⃣ Testing S3 Access...')
    try {
      const s3Client = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
        }
      })
      
      const command = new ListBucketsCommand({})
      await s3Client.send(command)
      console.log('   ✅ S3 access successful')
      console.log(`   📦 Configured bucket: ${process.env.AWS_S3_BUCKET}`)
      
    } catch (error) {
      console.log('   ❌ S3 access failed:')
      console.log(`      ${error instanceof Error ? error.message : 'Unknown error'}`)
      allTestsPassed = false
    }
  } else {
    console.log('\n5️⃣ Skipping S3 test (bucket not configured)')
  }

  // Summary
  console.log('\n' + '='.repeat(50))
  if (allTestsPassed) {
    console.log('🎉 All tests passed! AWS setup is working correctly.')
  } else {
    console.log('❌ Some tests failed. Please check the errors above.')
    console.log('\n📋 Common solutions:')
    console.log('   • Ensure all environment variables are set in .env')
    console.log('   • Check AWS credentials and permissions')
    console.log('   • Verify AWS resources are created and available')
    console.log('   • Check network connectivity and security groups')
  }
  console.log('='.repeat(50))

  process.exit(allTestsPassed ? 0 : 1)
}
  console.log("Testing AWS credentials...")
  
  try {
    // Create S3 client
    const s3Client = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })

    // Test connection by listing buckets
    const command = new ListBucketsCommand({})
    const response = await s3Client.send(command)
    
    console.log("\nAWS Environment Variables:")
    console.log(`Region: ${process.env.AWS_REGION}`)
    console.log(`Access Key ID: ${process.env.AWS_ACCESS_KEY_ID?.slice(0, 5)}...`)
    console.log(`Backup Bucket: ${process.env.AWS_BACKUP_BUCKET}`)
    
    console.log("\nConnection successful!")
    console.log("Available buckets:", response.Buckets?.map(b => b.Name).join(", "))
    
    // Check if backup bucket exists
    const backupBucket = response.Buckets?.find(b => b.Name === process.env.AWS_BACKUP_BUCKET)
    if (backupBucket) {
      console.log("\n✅ Backup bucket found and accessible!")
    } else {
      console.log("\n⚠️ Warning: Backup bucket not found. Please create it first.")
    }

  } catch (error) {
    console.error("\n❌ Error testing AWS credentials:", error)
    if (error instanceof Error && error.message.includes("credentials")) {
      console.log("\nTroubleshooting tips:")
      console.log("1. Double check the environment variables are set correctly")
      console.log("2. Make sure you've restarted your terminal/VS Code after setting the variables")
      console.log("3. Verify the AWS credentials have proper S3 permissions")
    }
  }
}

testAWSCredentials()
