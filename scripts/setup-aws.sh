#!/usr/bin/env bash

# 🚀 Bstream AWS Infrastructure Setup Script
# This script creates the necessary AWS resources for the Bstream application

set -e  # Exit on any error

echo "🚀 Starting Bstream AWS Infrastructure Setup..."

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
PROJECT_NAME="bstream"
ENVIRONMENT=${ENVIRONMENT:-dev}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if AWS CLI is installed
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    log_success "AWS CLI is installed"
}

# Check AWS credentials
check_aws_credentials() {
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured. Run 'aws configure' first."
        exit 1
    fi
    log_success "AWS credentials are configured"
}

# Create RDS PostgreSQL Database
create_rds_database() {
    log_info "Creating RDS PostgreSQL database..."
    
    DB_INSTANCE_ID="${PROJECT_NAME}-db-${ENVIRONMENT}"
    DB_NAME="bstream"
    DB_USERNAME="bstream_user"
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    
    # Create DB subnet group
    aws rds create-db-subnet-group \
        --db-subnet-group-name "${PROJECT_NAME}-subnet-group-${ENVIRONMENT}" \
        --db-subnet-group-description "Subnet group for ${PROJECT_NAME} ${ENVIRONMENT}" \
        --subnet-ids subnet-12345678 subnet-87654321 \
        --region $AWS_REGION \
        2>/dev/null || log_warning "DB subnet group might already exist"
    
    # Create RDS instance
    aws rds create-db-instance \
        --db-instance-identifier $DB_INSTANCE_ID \
        --db-instance-class db.t3.micro \
        --engine postgres \
        --engine-version 15.4 \
        --master-username $DB_USERNAME \
        --master-user-password $DB_PASSWORD \
        --allocated-storage 20 \
        --storage-type gp2 \
        --vpc-security-group-ids sg-12345678 \
        --db-subnet-group-name "${PROJECT_NAME}-subnet-group-${ENVIRONMENT}" \
        --backup-retention-period 7 \
        --storage-encrypted \
        --region $AWS_REGION
    
    log_success "RDS database creation initiated"
    log_info "Database ID: $DB_INSTANCE_ID"
    log_info "Username: $DB_USERNAME"
    log_info "Password: $DB_PASSWORD (save this securely!)"
    
    # Save credentials to Parameter Store
    aws ssm put-parameter \
        --name "/${PROJECT_NAME}/${ENVIRONMENT}/database/username" \
        --value $DB_USERNAME \
        --type SecureString \
        --region $AWS_REGION
    
    aws ssm put-parameter \
        --name "/${PROJECT_NAME}/${ENVIRONMENT}/database/password" \
        --value $DB_PASSWORD \
        --type SecureString \
        --region $AWS_REGION
}

# Create ElastiCache Redis Cluster
create_redis_cluster() {
    log_info "Creating ElastiCache Redis cluster..."
    
    CACHE_CLUSTER_ID="${PROJECT_NAME}-cache-${ENVIRONMENT}"
    
    # Create cache subnet group
    aws elasticache create-cache-subnet-group \
        --cache-subnet-group-name "${PROJECT_NAME}-cache-subnet-${ENVIRONMENT}" \
        --cache-subnet-group-description "Cache subnet group for ${PROJECT_NAME} ${ENVIRONMENT}" \
        --subnet-ids subnet-12345678 subnet-87654321 \
        --region $AWS_REGION \
        2>/dev/null || log_warning "Cache subnet group might already exist"
    
    # Create Redis cluster
    aws elasticache create-cache-cluster \
        --cache-cluster-id $CACHE_CLUSTER_ID \
        --cache-node-type cache.t3.micro \
        --engine redis \
        --num-cache-nodes 1 \
        --cache-subnet-group-name "${PROJECT_NAME}-cache-subnet-${ENVIRONMENT}" \
        --security-group-ids sg-12345678 \
        --region $AWS_REGION
    
    log_success "Redis cluster creation initiated"
    log_info "Cluster ID: $CACHE_CLUSTER_ID"
}

# Create S3 Buckets
create_s3_buckets() {
    log_info "Creating S3 buckets..."
    
    MAIN_BUCKET="${PROJECT_NAME}-files-${ENVIRONMENT}"
    BACKUP_BUCKET="${PROJECT_NAME}-backups-${ENVIRONMENT}"
    
    # Create main bucket
    aws s3 mb s3://$MAIN_BUCKET --region $AWS_REGION
    
    # Create backup bucket
    aws s3 mb s3://$BACKUP_BUCKET --region $AWS_REGION
    
    # Enable versioning
    aws s3api put-bucket-versioning \
        --bucket $MAIN_BUCKET \
        --versioning-configuration Status=Enabled
    
    aws s3api put-bucket-versioning \
        --bucket $BACKUP_BUCKET \
        --versioning-configuration Status=Enabled
    
    # Apply bucket policies
    aws s3api put-bucket-policy \
        --bucket $MAIN_BUCKET \
        --policy file://aws/s3-bucket-policy.json
    
    log_success "S3 buckets created"
    log_info "Main bucket: $MAIN_BUCKET"
    log_info "Backup bucket: $BACKUP_BUCKET"
}

# Create IAM Role and Policies
create_iam_resources() {
    log_info "Creating IAM resources..."
    
    ROLE_NAME="${PROJECT_NAME}-app-role-${ENVIRONMENT}"
    POLICY_NAME="${PROJECT_NAME}-app-policy-${ENVIRONMENT}"
    
    # Create IAM role
    aws iam create-role \
        --role-name $ROLE_NAME \
        --assume-role-policy-document file://aws/cross-account-policy.json \
        --region $AWS_REGION
    
    # Create and attach policy
    aws iam create-policy \
        --policy-name $POLICY_NAME \
        --policy-document file://aws/app-permissions-policy.json \
        --region $AWS_REGION
    
    aws iam attach-role-policy \
        --role-name $ROLE_NAME \
        --policy-arn "arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):policy/$POLICY_NAME"
    
    log_success "IAM resources created"
    log_info "Role: $ROLE_NAME"
    log_info "Policy: $POLICY_NAME"
}

# Wait for RDS to be available
wait_for_rds() {
    log_info "Waiting for RDS instance to be available..."
    
    DB_INSTANCE_ID="${PROJECT_NAME}-db-${ENVIRONMENT}"
    
    aws rds wait db-instance-available \
        --db-instance-identifier $DB_INSTANCE_ID \
        --region $AWS_REGION
    
    # Get RDS endpoint
    RDS_ENDPOINT=$(aws rds describe-db-instances \
        --db-instance-identifier $DB_INSTANCE_ID \
        --query 'DBInstances[0].Endpoint.Address' \
        --output text \
        --region $AWS_REGION)
    
    log_success "RDS instance is available"
    log_info "RDS Endpoint: $RDS_ENDPOINT"
    
    # Save endpoint to Parameter Store
    aws ssm put-parameter \
        --name "/${PROJECT_NAME}/${ENVIRONMENT}/database/endpoint" \
        --value $RDS_ENDPOINT \
        --type String \
        --region $AWS_REGION
}

# Generate environment file
generate_env_file() {
    log_info "Generating .env file..."
    
    # Get values from Parameter Store
    DB_USERNAME=$(aws ssm get-parameter \
        --name "/${PROJECT_NAME}/${ENVIRONMENT}/database/username" \
        --with-decryption \
        --query 'Parameter.Value' \
        --output text \
        --region $AWS_REGION)
    
    DB_PASSWORD=$(aws ssm get-parameter \
        --name "/${PROJECT_NAME}/${ENVIRONMENT}/database/password" \
        --with-decryption \
        --query 'Parameter.Value' \
        --output text \
        --region $AWS_REGION)
    
    DB_ENDPOINT=$(aws ssm get-parameter \
        --name "/${PROJECT_NAME}/${ENVIRONMENT}/database/endpoint" \
        --query 'Parameter.Value' \
        --output text \
        --region $AWS_REGION)
    
    # Get Redis endpoint
    REDIS_ENDPOINT=$(aws elasticache describe-cache-clusters \
        --cache-cluster-id "${PROJECT_NAME}-cache-${ENVIRONMENT}" \
        --show-cache-node-info \
        --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' \
        --output text \
        --region $AWS_REGION)
    
    # Create .env file
    cat > .env.aws << EOF
# AWS Configuration
AWS_REGION=$AWS_REGION
DATABASE_URL=postgresql://$DB_USERNAME:$DB_PASSWORD@$DB_ENDPOINT:5432/bstream
REDIS_URL=redis://$REDIS_ENDPOINT:6379
AWS_S3_BUCKET=${PROJECT_NAME}-files-${ENVIRONMENT}
AWS_S3_BACKUP_BUCKET=${PROJECT_NAME}-backups-${ENVIRONMENT}

# Copy these values to your main .env file
EOF
    
    log_success ".env.aws file generated with AWS connection details"
}

# Main execution
main() {
    log_info "Starting AWS infrastructure setup for Bstream"
    
    check_aws_cli
    check_aws_credentials
    
    # Create resources
    create_s3_buckets
    create_redis_cluster
    create_rds_database
    create_iam_resources
    
    # Wait for services to be ready
    wait_for_rds
    
    # Generate configuration
    generate_env_file
    
    log_success "🎉 AWS infrastructure setup completed!"
    log_info "Next steps:"
    log_info "1. Copy values from .env.aws to your main .env file"
    log_info "2. Update your AWS credentials in .env"
    log_info "3. Run 'npm run db:migrate' to set up the database schema"
    log_info "4. Test the setup with 'npm run test:aws'"
}

# Run main function
main "$@"
