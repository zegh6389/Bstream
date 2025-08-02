# 🚀 Bstream AWS Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. Prerequisites
- [ ] AWS Account created and active
- [ ] AWS CLI installed (`aws --version`)
- [ ] AWS credentials configured (`aws configure`)
- [ ] Node.js 18+ installed
- [ ] Git repository ready

### 2. Local Setup Verification
- [ ] All tests passing (`npm test`)
- [ ] Application runs locally (`npm run dev`)
- [ ] Environment variables configured
- [ ] Database schema validated

## 🛠️ AWS Deployment Steps

### Phase 1: AWS Resource Creation (15-20 minutes)

#### Option A: Windows PowerShell
```bash
npm run aws:deploy
```

#### Option B: Linux/Mac
```bash
npm run aws:deploy:linux
```

#### Manual Steps (if scripts fail):
1. **Create S3 Buckets**
   ```bash
   aws s3 mb s3://bstream-files-production --region us-east-1
   aws s3 mb s3://bstream-backups-production --region us-east-1
   ```

2. **Create RDS PostgreSQL Instance**
   ```bash
   aws rds create-db-instance \
     --db-instance-identifier bstream-db-production \
     --db-instance-class db.t3.micro \
     --engine postgres \
     --master-username bstreamadmin \
     --master-user-password YOUR_SECURE_PASSWORD \
     --allocated-storage 20 \
     --publicly-accessible \
     --backup-retention-period 7
   ```

3. **Create ElastiCache Redis Cluster**
   ```bash
   aws elasticache create-cache-cluster \
     --cache-cluster-id bstream-cache-production \
     --cache-node-type cache.t3.micro \
     --engine redis \
     --num-cache-nodes 1
   ```

### Phase 2: Monitor Resource Creation (10-15 minutes)

Check deployment status:
```bash
npm run aws:status
```

### Phase 3: Configure Environment Variables

1. **Wait for resources to be 'available'**
2. **Get actual endpoints from status check**
3. **Update environment file:**

```env
# .env.production
AWS_REGION=us-east-1
AWS_S3_BUCKET=bstream-files-production
AWS_S3_BACKUP_BUCKET=bstream-backups-production

# Update with actual endpoints from aws:status
DATABASE_URL=postgresql://bstreamadmin:YOUR_PASSWORD@your-rds-endpoint:5432/postgres
REDIS_URL=redis://your-elasticache-endpoint:6379

# Required for NextAuth
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-super-secure-secret-here

# OAuth (if using)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret
```

### Phase 4: Database Migration

```bash
# Set environment for AWS
export DATABASE_URL="your-postgresql-connection-string"

# Run migrations
npm run db:migrate:aws

# Generate Prisma client for PostgreSQL
npm run db:generate:aws
```

### Phase 5: Test AWS Integration

```bash
# Test AWS services connection
npm run test:aws

# Check health endpoint
npm run aws:health
```

## 🔧 Hosting Platform Setup

### Vercel Deployment
1. **Connect GitHub repository to Vercel**
2. **Add environment variables in Vercel dashboard**
3. **Set build command:** `npm run build`
4. **Set output directory:** `.next`

### Railway Deployment
1. **Connect GitHub repository to Railway**
2. **Add environment variables**
3. **Railway will auto-detect Next.js**

### AWS App Runner / ECS (Advanced)
1. **Create Dockerfile** (already included)
2. **Push to ECR**
3. **Configure App Runner**

## 📊 Monitoring & Maintenance

### Daily Monitoring
- [ ] Check CloudWatch logs
- [ ] Monitor RDS performance
- [ ] Check S3 usage and costs
- [ ] Verify application health endpoints

### Weekly Tasks
- [ ] Review AWS billing
- [ ] Check database backups
- [ ] Update dependencies
- [ ] Security patches

### Monthly Tasks
- [ ] Cost optimization review
- [ ] Performance analysis
- [ ] Security audit
- [ ] Backup testing

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Test connection
psql -h your-rds-endpoint -U bstreamadmin -d postgres

# Check security groups
aws rds describe-db-instances --db-instance-identifier bstream-db-production
```

#### Redis Connection Issues
```bash
# Test Redis connection
redis-cli -h your-elasticache-endpoint -p 6379 ping
```

#### S3 Permission Issues
```bash
# Test S3 access
aws s3 ls s3://bstream-files-production
```

### Logs and Debugging
```bash
# Check CloudWatch logs
aws logs describe-log-groups

# Application logs
npm run dev  # Check local logs
```

## 💰 Cost Optimization

### Free Tier Usage (First 12 months)
- RDS: 750 hours/month of db.t3.micro
- ElastiCache: 750 hours/month of cache.t3.micro
- S3: 5GB storage, 20,000 GET requests, 2,000 PUT requests

### Cost Monitoring
- Set up AWS Budgets
- Enable cost alerts
- Regular usage review

## 🔐 Security Considerations

### Production Security Checklist
- [ ] Enable RDS encryption
- [ ] Configure VPC and security groups
- [ ] Set up WAF (if using ALB)
- [ ] Enable CloudTrail logging
- [ ] Regular security updates
- [ ] Environment variable protection

### Backup Strategy
- [ ] Automated RDS backups (7-30 days retention)
- [ ] S3 bucket versioning enabled
- [ ] Regular backup testing
- [ ] Disaster recovery plan

## 📞 Support and Resources

### AWS Documentation
- [RDS PostgreSQL Guide](https://docs.aws.amazon.com/rds/latest/userguide/CHAP_PostgreSQL.html)
- [ElastiCache Redis Guide](https://docs.aws.amazon.com/AmazonElastiCache/latest/red-ug/)
- [S3 Best Practices](https://docs.aws.amazon.com/s3/latest/userguide/best-practices.html)

### Bstream Specific
- Check `AWS_SETUP_GUIDE.md` for detailed service information
- Check `AWS_MIGRATION_GUIDE.md` for migration specifics
- Use `npm run aws:status` for real-time resource monitoring

## ✅ Deployment Complete

Once all steps are completed:
- [ ] Application deployed and accessible
- [ ] All AWS resources operational
- [ ] Monitoring configured
- [ ] Backups verified
- [ ] Security measures in place
- [ ] Documentation updated

**🎉 Congratulations! Your Bstream application is now running on AWS!**
