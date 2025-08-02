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

  // Test 4: S3 Access (if configured)
  if (process.env.AWS_S3_BUCKET && process.env.AWS_ACCESS_KEY_ID) {
    console.log('\n4️⃣ Testing S3 Access...')
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
    console.log('\n4️⃣ Skipping S3 test (bucket not configured)')
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

// Run the test
testAWSSetup().catch((error) => {
  console.error('Test execution failed:', error)
  process.exit(1)
})
