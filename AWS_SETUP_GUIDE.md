# 🚀 Bstream AWS Migration & Setup Guide

## 📋 AWS Services Required

### 1. **Database Services**
- **Amazon RDS (PostgreSQL)** - Primary database
  - Instance: `db.t3.micro` (Free tier) or `db.t3.small` (Production)
  - Multi-AZ: Yes (for production)
  - Storage: 20GB - 100GB (adjustable)
  - Backup retention: 7-30 days

### 2. **Storage Services**
- **Amazon S3** - File storage and backups
  - Main bucket: File uploads, receipts, attachments
  - Backup bucket: Database backups, system backups
  - Versioning: Enabled
  - Lifecycle policies: For cost optimization

### 3. **Caching & Performance**
- **Amazon ElastiCache (Redis)** - Session management and rate limiting
  - Instance: `cache.t3.micro` (Free tier)
  - Cluster mode: Disabled (for simplicity)

### 4. **Security & Monitoring**
- **AWS KMS** - Encryption key management
- **AWS CloudWatch** - Logging and monitoring
- **AWS Systems Manager Parameter Store** - Secure configuration storage
- **AWS IAM** - Access control and policies

### 5. **Optional Services (For Production)**
- **Amazon SES** - Email service for transactional emails
- **AWS Lambda** - Serverless functions for background tasks
- **Amazon CloudFront** - CDN for global content delivery
- **AWS Route 53** - DNS management and domain routing
  - Custom domain setup (yourdomain.com → your-app)
  - SSL certificate management with ACM
  - Health checks and failover routing
  - Geographic routing for global users
- **AWS Application Load Balancer** - Load balancing and SSL termination
- **AWS Certificate Manager** - Free SSL certificates
- **AWS CloudWatch** - Enhanced monitoring and alerting

## 💰 Estimated Monthly Costs (Free Tier + Small Scale)
- RDS (db.t3.micro): $15-25/month
- ElastiCache (cache.t3.micro): $15-20/month
- S3 Storage (50GB): $1-2/month
- CloudWatch: $5-10/month
- **Total: ~$36-57/month**

## 🔐 Required AWS IAM Permissions

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "rds:DescribeDBInstances",
        "rds:Connect"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "elasticache:DescribeCacheClusters",
        "elasticache:DescribeReplicationGroups"
      ],
      "Resource": "*"
    }
  ]
}
```

## 🛠️ Setup Steps Overview

### Phase 1: Database Migration
1. Create RDS PostgreSQL instance
2. Update Prisma schema for PostgreSQL
3. Run database migrations
4. Update connection strings

### Phase 2: Storage Setup
1. Create S3 buckets
2. Configure bucket policies
3. Set up file upload endpoints
4. Configure backup system

### Phase 3: Caching Setup
1. Create ElastiCache Redis cluster
2. Update session management
3. Configure rate limiting

### Phase 4: Security & Monitoring
1. Set up CloudWatch logging
2. Configure KMS encryption
3. Set up monitoring dashboards

## 🔧 Environment Variables Needed

```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# RDS Database
DATABASE_URL=postgresql://username:password@your-rds-endpoint:5432/bstream

# ElastiCache Redis
REDIS_URL=redis://your-elasticache-endpoint:6379

# S3 Storage
AWS_S3_BUCKET=bstream-files-prod
AWS_S3_BACKUP_BUCKET=bstream-backups-prod
AWS_S3_REGION=us-east-1

# Optional: SES Email
AWS_SES_REGION=us-east-1
AWS_SES_FROM_EMAIL=noreply@yourdomain.com
```
