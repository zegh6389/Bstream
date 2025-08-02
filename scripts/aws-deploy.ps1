# Bstream AWS Deployment Script
# This script automates the AWS resource creation process

param(
    [string]$Environment = "production",
    [string]$Region = "us-east-1",
    [switch]$DryRun = $false
)

Write-Host "🚀 Starting Bstream AWS Deployment" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Region: $Region" -ForegroundColor Yellow

if ($DryRun) {
    Write-Host "DRY RUN MODE - No resources will be created" -ForegroundColor Cyan
}

# Check AWS CLI installation
Write-Host "`n📋 Checking prerequisites..." -ForegroundColor Blue
try {
    $awsVersion = aws --version
    Write-Host "✅ AWS CLI found: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI not found. Please install AWS CLI first." -ForegroundColor Red
    exit 1
}

# Check AWS credentials
try {
    $identity = aws sts get-caller-identity --output json | ConvertFrom-Json
    Write-Host "✅ AWS credentials configured for: $($identity.Arn)" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS credentials not configured. Run 'aws configure' first." -ForegroundColor Red
    exit 1
}

# Set variables
$ProjectName = "bstream"
$BucketName = "$ProjectName-files-$Environment"
$BackupBucketName = "$ProjectName-backups-$Environment"
$DBInstanceId = "$ProjectName-db-$Environment"
$CacheClusterId = "$ProjectName-cache-$Environment"

Write-Host "`n🗂️  Resource names:" -ForegroundColor Blue
Write-Host "  S3 Bucket: $BucketName" -ForegroundColor Gray
Write-Host "  Backup Bucket: $BackupBucketName" -ForegroundColor Gray
Write-Host "  RDS Instance: $DBInstanceId" -ForegroundColor Gray
Write-Host "  Cache Cluster: $CacheClusterId" -ForegroundColor Gray

if ($DryRun) {
    Write-Host "`n✅ Dry run completed - resources would be created with above names" -ForegroundColor Green
    exit 0
}

# Confirm deployment
$confirm = Read-Host "`nDo you want to proceed with deployment? (y/N)"
if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host "`n🚀 Starting deployment..." -ForegroundColor Green

# Create S3 buckets
Write-Host "`n📦 Creating S3 buckets..." -ForegroundColor Blue
try {
    aws s3 mb "s3://$BucketName" --region $Region
    aws s3 mb "s3://$BackupBucketName" --region $Region
    Write-Host "✅ S3 buckets created successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️  S3 bucket creation failed (may already exist): $($_.Exception.Message)" -ForegroundColor Yellow
}

# Apply S3 bucket policies
Write-Host "`n🔒 Applying S3 bucket policies..." -ForegroundColor Blue
$bucketPolicy = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowAppAccess",
      "Effect": "Allow",
      "Principal": {
        "AWS": "$($identity.Arn)"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::$BucketName/*"
    }
  ]
}
"@

$bucketPolicy | Out-File -FilePath "temp-bucket-policy.json" -Encoding UTF8
aws s3api put-bucket-policy --bucket $BucketName --policy file://temp-bucket-policy.json
Remove-Item "temp-bucket-policy.json"

Write-Host "✅ S3 bucket policies applied" -ForegroundColor Green

# Create RDS instance
Write-Host "`n🗄️  Creating RDS PostgreSQL instance..." -ForegroundColor Blue
Write-Host "This may take 10-15 minutes..." -ForegroundColor Yellow

$dbPassword = Read-Host "Enter a secure password for the database (minimum 8 characters)" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword))

try {
    aws rds create-db-instance `
        --db-instance-identifier $DBInstanceId `
        --db-instance-class db.t3.micro `
        --engine postgres `
        --master-username bstreamadmin `
        --master-user-password $dbPasswordPlain `
        --allocated-storage 20 `
        --vpc-security-group-ids default `
        --publicly-accessible `
        --no-multi-az `
        --storage-type gp2 `
        --backup-retention-period 7 `
        --region $Region
    
    Write-Host "✅ RDS instance creation initiated" -ForegroundColor Green
} catch {
    Write-Host "⚠️  RDS creation failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Create ElastiCache Redis cluster
Write-Host "`n⚡ Creating ElastiCache Redis cluster..." -ForegroundColor Blue
try {
    aws elasticache create-cache-cluster `
        --cache-cluster-id $CacheClusterId `
        --cache-node-type cache.t3.micro `
        --engine redis `
        --num-cache-nodes 1 `
        --region $Region

    Write-Host "✅ ElastiCache cluster creation initiated" -ForegroundColor Green
} catch {
    Write-Host "⚠️  ElastiCache creation failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Wait for resources to be ready
Write-Host "`n⏳ Waiting for resources to be ready..." -ForegroundColor Blue
Write-Host "This may take 10-15 minutes. You can check status in AWS Console." -ForegroundColor Yellow

# Generate environment file
Write-Host "`n📝 Generating environment configuration..." -ForegroundColor Blue

$envContent = @"
# AWS Configuration for $Environment
AWS_REGION=$Region
AWS_S3_BUCKET=$BucketName
AWS_S3_BACKUP_BUCKET=$BackupBucketName

# Database (Update with actual endpoint after RDS is ready)
DATABASE_URL=postgresql://bstreamadmin:$dbPasswordPlain@$DBInstanceId.$Region.rds.amazonaws.com:5432/postgres

# Redis (Update with actual endpoint after ElastiCache is ready)
REDIS_URL=redis://$CacheClusterId.cache.amazonaws.com:6379

# Add your other environment variables here
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-super-secure-secret-here
"@

$envContent | Out-File -FilePath ".env.aws.$Environment" -Encoding UTF8
Write-Host "✅ Environment file created: .env.aws.$Environment" -ForegroundColor Green

Write-Host "`n🎉 Deployment initiated successfully!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Blue
Write-Host "1. Wait for RDS and ElastiCache to be ready (10-15 minutes)" -ForegroundColor Gray
Write-Host "2. Update .env.aws.$Environment with actual endpoints" -ForegroundColor Gray
Write-Host "3. Run database migrations: npm run db:migrate:aws" -ForegroundColor Gray
Write-Host "4. Deploy your application to your hosting platform" -ForegroundColor Gray

Write-Host "`n📊 Check resource status with:" -ForegroundColor Blue
Write-Host "  aws rds describe-db-instances --db-instance-identifier $DBInstanceId" -ForegroundColor Gray
Write-Host "  aws elasticache describe-cache-clusters --cache-cluster-id $CacheClusterId" -ForegroundColor Gray
