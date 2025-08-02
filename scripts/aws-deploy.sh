#!/bin/bash
# Bstream AWS Deployment Script (Linux/Mac version)
# This script automates the AWS resource creation process

set -e  # Exit on any error

ENVIRONMENT=${1:-production}
REGION=${2:-us-east-1}
DRY_RUN=${3:-false}

echo "🚀 Starting Bstream AWS Deployment"
echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"

if [ "$DRY_RUN" = "true" ]; then
    echo "DRY RUN MODE - No resources will be created"
fi

# Check AWS CLI installation
echo ""
echo "📋 Checking prerequisites..."
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install AWS CLI first."
    exit 1
fi

AWS_VERSION=$(aws --version)
echo "✅ AWS CLI found: $AWS_VERSION"

# Check AWS credentials
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS credentials not configured. Run 'aws configure' first."
    exit 1
fi

IDENTITY=$(aws sts get-caller-identity --output json)
ARN=$(echo $IDENTITY | jq -r '.Arn')
echo "✅ AWS credentials configured for: $ARN"

# Set variables
PROJECT_NAME="bstream"
BUCKET_NAME="$PROJECT_NAME-files-$ENVIRONMENT"
BACKUP_BUCKET_NAME="$PROJECT_NAME-backups-$ENVIRONMENT"
DB_INSTANCE_ID="$PROJECT_NAME-db-$ENVIRONMENT"
CACHE_CLUSTER_ID="$PROJECT_NAME-cache-$ENVIRONMENT"

echo ""
echo "🗂️  Resource names:"
echo "  S3 Bucket: $BUCKET_NAME"
echo "  Backup Bucket: $BACKUP_BUCKET_NAME"
echo "  RDS Instance: $DB_INSTANCE_ID"
echo "  Cache Cluster: $CACHE_CLUSTER_ID"

if [ "$DRY_RUN" = "true" ]; then
    echo ""
    echo "✅ Dry run completed - resources would be created with above names"
    exit 0
fi

# Confirm deployment
echo ""
read -p "Do you want to proceed with deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

echo ""
echo "🚀 Starting deployment..."

# Create S3 buckets
echo ""
echo "📦 Creating S3 buckets..."
aws s3 mb "s3://$BUCKET_NAME" --region $REGION || echo "⚠️  Bucket may already exist"
aws s3 mb "s3://$BACKUP_BUCKET_NAME" --region $REGION || echo "⚠️  Backup bucket may already exist"
echo "✅ S3 buckets created successfully"

# Apply S3 bucket policies
echo ""
echo "🔒 Applying S3 bucket policies..."
cat > temp-bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowAppAccess",
      "Effect": "Allow",
      "Principal": {
        "AWS": "$ARN"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file://temp-bucket-policy.json
rm temp-bucket-policy.json
echo "✅ S3 bucket policies applied"

# Create RDS instance
echo ""
echo "🗄️  Creating RDS PostgreSQL instance..."
echo "This may take 10-15 minutes..."

read -s -p "Enter a secure password for the database (minimum 8 characters): " DB_PASSWORD
echo

aws rds create-db-instance \
    --db-instance-identifier $DB_INSTANCE_ID \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --master-username bstreamadmin \
    --master-user-password $DB_PASSWORD \
    --allocated-storage 20 \
    --vpc-security-group-ids default \
    --publicly-accessible \
    --no-multi-az \
    --storage-type gp2 \
    --backup-retention-period 7 \
    --region $REGION || echo "⚠️  RDS creation failed or instance may already exist"

echo "✅ RDS instance creation initiated"

# Create ElastiCache Redis cluster
echo ""
echo "⚡ Creating ElastiCache Redis cluster..."
aws elasticache create-cache-cluster \
    --cache-cluster-id $CACHE_CLUSTER_ID \
    --cache-node-type cache.t3.micro \
    --engine redis \
    --num-cache-nodes 1 \
    --region $REGION || echo "⚠️  ElastiCache creation failed or cluster may already exist"

echo "✅ ElastiCache cluster creation initiated"

# Generate environment file
echo ""
echo "📝 Generating environment configuration..."

cat > .env.aws.$ENVIRONMENT << EOF
# AWS Configuration for $ENVIRONMENT
AWS_REGION=$REGION
AWS_S3_BUCKET=$BUCKET_NAME
AWS_S3_BACKUP_BUCKET=$BACKUP_BUCKET_NAME

# Database (Update with actual endpoint after RDS is ready)
DATABASE_URL=postgresql://bstreamadmin:$DB_PASSWORD@$DB_INSTANCE_ID.$REGION.rds.amazonaws.com:5432/postgres

# Redis (Update with actual endpoint after ElastiCache is ready)
REDIS_URL=redis://$CACHE_CLUSTER_ID.cache.amazonaws.com:6379

# Add your other environment variables here
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-super-secure-secret-here
EOF

echo "✅ Environment file created: .env.aws.$ENVIRONMENT"

echo ""
echo "🎉 Deployment initiated successfully!"
echo ""
echo "Next steps:"
echo "1. Wait for RDS and ElastiCache to be ready (10-15 minutes)"
echo "2. Update .env.aws.$ENVIRONMENT with actual endpoints"
echo "3. Run database migrations: npm run db:migrate:aws"
echo "4. Deploy your application to your hosting platform"

echo ""
echo "📊 Check resource status with:"
echo "  aws rds describe-db-instances --db-instance-identifier $DB_INSTANCE_ID"
echo "  aws elasticache describe-cache-clusters --cache-cluster-id $CACHE_CLUSTER_ID"
