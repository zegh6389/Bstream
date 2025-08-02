#!/bin/bash
# AWS Resource Status Checker (Linux/Mac version)
# This script checks the status of your Bstream AWS resources

set -e

ENVIRONMENT=${1:-production}
REGION=${2:-us-east-1}

echo "📊 Checking Bstream AWS Resources Status"
echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"

# Set variables
PROJECT_NAME="bstream"
BUCKET_NAME="$PROJECT_NAME-files-$ENVIRONMENT"
BACKUP_BUCKET_NAME="$PROJECT_NAME-backups-$ENVIRONMENT"
DB_INSTANCE_ID="$PROJECT_NAME-db-$ENVIRONMENT"
CACHE_CLUSTER_ID="$PROJECT_NAME-cache-$ENVIRONMENT"

echo ""
echo "🗂️  Checking resources..."

# Check S3 buckets
echo ""
echo "📦 S3 Buckets:"
if aws s3 ls "s3://$BUCKET_NAME" --region $REGION > /dev/null 2>&1; then
    echo "  [OK] Main bucket: $BUCKET_NAME"
else
    echo "  [X] Main bucket: $BUCKET_NAME (Not found)"
fi

if aws s3 ls "s3://$BACKUP_BUCKET_NAME" --region $REGION > /dev/null 2>&1; then
    echo "  [OK] Backup bucket: $BACKUP_BUCKET_NAME"
else
    echo "  [X] Backup bucket: $BACKUP_BUCKET_NAME (Not found)"
fi

# Check RDS instance
echo ""
echo "🗄️  RDS Database:"
if ! RDS_INFO=$(aws rds describe-db-instances --db-instance-identifier $DB_INSTANCE_ID --region $REGION --output json 2>/dev/null); then
    echo "  [X] RDS instance not found or error occurred."
else
    DB_STATUS=$(echo $RDS_INFO | jq -r '.DBInstances[0].DBInstanceStatus')
    DB_ENDPOINT=$(echo $RDS_INFO | jq -r '.DBInstances[0].Endpoint.Address')
    DB_PORT=$(echo $RDS_INFO | jq -r '.DBInstances[0].Endpoint.Port')

    echo "  Status: $DB_STATUS"
    echo "  Endpoint: $DB_ENDPOINT:$DB_PORT"
    
    if [ "$DB_STATUS" == "available" ]; then
        echo "  [OK] Database is ready for connections"
        echo "  Connection string: postgresql://bstreamadmin:YOUR_PASSWORD@$DB_ENDPOINT:$DB_PORT/postgres"
    fi
fi

# Check ElastiCache cluster
echo ""
echo "⚡ ElastiCache Redis:"
if ! CACHE_INFO=$(aws elasticache describe-cache-clusters --cache-cluster-id $CACHE_CLUSTER_ID --show-cache-node-info --region $REGION --output json 2>/dev/null); then
    echo "  [X] ElastiCache cluster not found or error occurred."
else
    CACHE_STATUS=$(echo $CACHE_INFO | jq -r '.CacheClusters[0].CacheClusterStatus')
    CACHE_ENDPOINT=$(echo $CACHE_INFO | jq -r '.CacheClusters[0].CacheNodes[0].Endpoint.Address')
    CACHE_PORT=$(echo $CACHE_INFO | jq -r '.CacheClusters[0].CacheNodes[0].Endpoint.Port')

    echo "  Status: $CACHE_STATUS"
    echo "  Endpoint: $CACHE_ENDPOINT:$CACHE_PORT"

    if [ "$CACHE_STATUS" == "available" ]; then
        echo "  [OK] Redis cluster is ready for connections"
        echo "  Connection string: redis://$CACHE_ENDPOINT:$CACHE_PORT"
    fi
fi

echo ""
echo "🎯 Next Steps:"
echo "1. If all resources are 'available', update your .env file with the endpoints and passwords."
echo "2. Deploy your application to your hosting provider (Vercel, Netlify, etc.)."
echo "3. Run the database migration against the new RDS database: npm run db:migrate:aws"
