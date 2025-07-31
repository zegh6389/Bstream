import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3"

async function testAWSCredentials() {
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
