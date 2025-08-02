# 🚀 AWS Migration Guide for Bstream

## 📋 Overview

This guide will help you migrate your Bstream application from local SQLite database to AWS cloud infrastructure with PostgreSQL RDS, ElastiCache Redis, and S3 storage.

## 🎯 Migration Steps

### Step 1: Prepare AWS Account

1. **Create AWS Account**
   - Sign up at [aws.amazon.com](https://aws.amazon.com)
   - Complete account verification
   - Add payment method

2. **Install AWS CLI**
   ```bash
   # Windows (PowerShell)
   winget install Amazon.AWSCLI
   
   # macOS
   brew install awscli
   
   # Linux
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install
   ```

3. **Configure AWS CLI**
   ```bash
   aws configure
   # Enter your Access Key ID, Secret Access Key, Region (e.g., us-east-1), and output format (json)
   ```

### Step 2: Create AWS Resources

#### Option A: Automated Setup (Recommended)
```bash
# Run the automated setup script
npm run aws:setup
```

#### Option B: Manual Setup

**Create RDS PostgreSQL Database:**
1. Go to AWS RDS Console
2. Click "Create database"
3. Choose "PostgreSQL"
4. Select "Free tier" template
5. Set DB instance identifier: `bstream-db-prod`
6. Master username: `bstream_user`
7. Master password: (generate secure password)
8. Keep default VPC and security group settings
9. Create database

**Create ElastiCache Redis Cluster:**
1. Go to AWS ElastiCache Console
2. Click "Create"
3. Choose "Redis"
4. Name: `bstream-cache-prod`
5. Node type: `cache.t3.micro`
6. Keep default settings
7. Create cluster

**Create S3 Buckets:**
1. Go to AWS S3 Console
2. Create bucket: `bstream-files-prod-[your-unique-suffix]`
3. Create bucket: `bstream-backups-prod-[your-unique-suffix]`
4. Enable versioning on both buckets

### Step 3: Update Environment Configuration

1. **Copy the AWS template:**
   ```bash
   cp .env.aws.template .env.aws
   ```

2. **Update .env.aws with your AWS resources:**
   ```env
   # AWS Configuration
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your-access-key-id
   AWS_SECRET_ACCESS_KEY=your-secret-access-key

   # Database (Get from RDS Console)
   DATABASE_URL=postgresql://bstream_user:your_password@your-rds-endpoint:5432/bstream

   # Redis (Get from ElastiCache Console)
   REDIS_URL=redis://your-elasticache-endpoint:6379

   # S3 Storage
   AWS_S3_BUCKET=bstream-files-prod-your-suffix
   AWS_S3_BACKUP_BUCKET=bstream-backups-prod-your-suffix
   ```

3. **Update your main .env file:**
   ```bash
   # Backup current .env
   cp .env .env.backup

   # Copy AWS configuration
   cat .env.aws >> .env
   ```

### Step 4: Update Database Schema

1. **Generate Prisma client for PostgreSQL:**
   ```bash
   npm run db:generate
   ```

2. **Run database migrations:**
   ```bash
   npm run db:migrate:aws
   ```

3. **Test database connection:**
   ```bash
   npm run test:aws
   ```

### Step 5: Migrate Data (if needed)

If you have existing data in SQLite:

1. **Export existing data:**
   ```bash
   # Create data export script
   npx tsx scripts/export-sqlite-data.ts
   ```

2. **Import data to PostgreSQL:**
   ```bash
   # Run import script
   npx tsx scripts/import-postgresql-data.ts
   ```

### Step 6: Test AWS Setup

1. **Run comprehensive tests:**
   ```bash
   npm run test:aws
   ```

2. **Test health endpoint:**
   ```bash
   npm run dev
   # In another terminal:
   npm run aws:health
   ```

3. **Verify all services:**
   - Database connection ✅
   - Redis connection ✅
   - S3 access ✅
   - Application functionality ✅

## 🔒 Security Checklist

### Database Security
- [ ] Enable SSL/TLS connections
- [ ] Configure security groups (allow only application access)
- [ ] Enable automated backups
- [ ] Set up monitoring and alerts

### Redis Security
- [ ] Enable AUTH (password protection)
- [ ] Configure VPC security groups
- [ ] Enable encryption in transit
- [ ] Set up monitoring

### S3 Security
- [ ] Configure bucket policies
- [ ] Enable server-side encryption
- [ ] Set up access logging
- [ ] Configure lifecycle policies

### Application Security
- [ ] Store credentials in AWS Systems Manager Parameter Store
- [ ] Use IAM roles instead of access keys (for EC2 deployment)
- [ ] Enable AWS CloudTrail for audit logging
- [ ] Set up AWS Config for compliance monitoring

## 💰 Cost Optimization

### Free Tier Resources (12 months)
- RDS: 750 hours of db.t3.micro
- ElastiCache: 750 hours of cache.t3.micro
- S3: 5GB of Standard storage

### Production Optimization
1. **Right-size instances** based on actual usage
2. **Use Reserved Instances** for 1-3 year commitments (up to 75% savings)
3. **Enable S3 lifecycle policies** to move old data to cheaper storage classes
4. **Monitor costs** with AWS Cost Explorer and set up billing alerts

## 🚨 Troubleshooting

### Common Issues

**Database Connection Timeouts:**
```bash
# Check security groups allow connections on port 5432
aws ec2 describe-security-groups --group-ids sg-your-group-id
```

**Redis Connection Failed:**
```bash
# Verify ElastiCache security group allows port 6379
# Check if Redis cluster is in same VPC as application
```

**S3 Access Denied:**
```bash
# Verify IAM user has S3 permissions
aws iam list-attached-user-policies --user-name your-username
```

**Environment Variables Not Loading:**
```bash
# Check if .env file has correct format
# Verify no spaces around = in environment variables
# Restart application after .env changes
```

### Getting Help

1. **AWS Support:**
   - Basic support is free
   - Use AWS forums and documentation
   - Consider Developer support plan ($29/month)

2. **Community Resources:**
   - [AWS Community](https://repost.aws/)
   - [Prisma Community](https://www.prisma.io/community)
   - [Next.js Discussions](https://github.com/vercel/next.js/discussions)

## 🎉 Next Steps After Migration

1. **Set up monitoring and alerts**
2. **Configure automated backups**
3. **Implement CI/CD pipeline**
4. **Set up staging environment**
5. **Plan for scaling and load balancing**

## 📞 Support

If you encounter issues during migration:

1. Check the troubleshooting section above
2. Run the health check: `npm run test:aws`
3. Review AWS CloudWatch logs
4. Check application logs for specific error messages

The migration should significantly improve your application's scalability, reliability, and performance! 🚀
