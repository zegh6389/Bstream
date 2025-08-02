# 🌐 AWS Resource Status Checker
# This script checks the status of your Bstream AWS resources

param(
    [string]$Environment = "production",
    [string]$Region = "us-east-1"
)

Write-Host "📊 Checking Bstream AWS Resources Status" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Region: $Region" -ForegroundColor Yellow

# Set variables
$ProjectName = "bstream"
$BucketName = "$ProjectName-files-$Environment"
$BackupBucketName = "$ProjectName-backups-$Environment"
$DBInstanceId = "$ProjectName-db-$Environment"
$CacheClusterId = "$ProjectName-cache-$Environment"

Write-Host "`n🗂️  Checking resources..." -ForegroundColor Blue

# Check S3 buckets
Write-Host "`n📦 S3 Buckets:" -ForegroundColor Blue
try {
    $buckets = aws s3api list-buckets --output json | ConvertFrom-Json
    $mainBucket = $buckets.Buckets | Where-Object { $_.Name -eq $BucketName }
    $backupBucket = $buckets.Buckets | Where-Object { $_.Name -eq $BackupBucketName }
    
    if ($mainBucket) {
        Write-Host "  ✅ Main bucket: $BucketName (Created: $($mainBucket.CreationDate))" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Main bucket: $BucketName (Not found)" -ForegroundColor Red
    }
    
    if ($backupBucket) {
        Write-Host "  ✅ Backup bucket: $BackupBucketName (Created: $($backupBucket.CreationDate))" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Backup bucket: $BackupBucketName (Not found)" -ForegroundColor Red
    }
} catch {
    Write-Host "  ❌ Error checking S3 buckets: $($_.Exception.Message)" -ForegroundColor Red
}

# Check RDS instance
Write-Host "`n🗄️  RDS Database:" -ForegroundColor Blue
try {
    $rdsInfo = aws rds describe-db-instances --db-instance-identifier $DBInstanceId --output json | ConvertFrom-Json
    $db = $rdsInfo.DBInstances[0]
    
    $statusColor = switch ($db.DBInstanceStatus) {
        "available" { "Green" }
        "creating" { "Yellow" }
        "modifying" { "Yellow" }
        default { "Red" }
    }
    
    Write-Host "  Status: $($db.DBInstanceStatus)" -ForegroundColor $statusColor
    Write-Host "  Endpoint: $($db.Endpoint.Address):$($db.Endpoint.Port)" -ForegroundColor Gray
    Write-Host "  Engine: $($db.Engine) $($db.EngineVersion)" -ForegroundColor Gray
    Write-Host "  Instance Class: $($db.DBInstanceClass)" -ForegroundColor Gray
    Write-Host "  Storage: $($db.AllocatedStorage)GB" -ForegroundColor Gray
    
    if ($db.DBInstanceStatus -eq "available") {
        Write-Host "  ✅ Database is ready for connections" -ForegroundColor Green
        Write-Host "  📝 Connection string: postgresql://bstreamadmin:YOUR_PASSWORD@$($db.Endpoint.Address):$($db.Endpoint.Port)/postgres" -ForegroundColor Cyan
    }
} catch {
    Write-Host "  ❌ RDS instance not found or error occurred: $($_.Exception.Message)" -ForegroundColor Red
}

# Check ElastiCache cluster
Write-Host "`n⚡ ElastiCache Redis:" -ForegroundColor Blue
try {
    $cacheInfo = aws elasticache describe-cache-clusters --cache-cluster-id $CacheClusterId --show-cache-node-info --output json | ConvertFrom-Json
    $cache = $cacheInfo.CacheClusters[0]
    
    $statusColor = switch ($cache.CacheClusterStatus) {
        "available" { "Green" }
        "creating" { "Yellow" }
        "modifying" { "Yellow" }
        default { "Red" }
    }
    
    Write-Host "  Status: $($cache.CacheClusterStatus)" -ForegroundColor $statusColor
    Write-Host "  Engine: $($cache.Engine) $($cache.EngineVersion)" -ForegroundColor Gray
    Write-Host "  Node Type: $($cache.CacheNodeType)" -ForegroundColor Gray
    
    if ($cache.CacheNodes -and $cache.CacheNodes[0].Endpoint) {
        Write-Host "  Endpoint: $($cache.CacheNodes[0].Endpoint.Address):$($cache.CacheNodes[0].Endpoint.Port)" -ForegroundColor Gray
        
        if ($cache.CacheClusterStatus -eq "available") {
            Write-Host "  ✅ Redis cluster is ready for connections" -ForegroundColor Green
            Write-Host "  📝 Connection string: redis://$($cache.CacheNodes[0].Endpoint.Address):$($cache.CacheNodes[0].Endpoint.Port)" -ForegroundColor Cyan
        }
    }
} catch {
    Write-Host "  ❌ ElastiCache cluster not found or error occurred: $($_.Exception.Message)" -ForegroundColor Red
}

# Generate updated environment file if resources are ready
Write-Host "`n📝 Environment Configuration:" -ForegroundColor Blue
$envFile = ".env.aws.$Environment"

if (Test-Path $envFile) {
    Write-Host "  ✅ Environment file exists: $envFile" -ForegroundColor Green
    
    # Check if we can update with actual endpoints
    try {
        $rdsInfo = aws rds describe-db-instances --db-instance-identifier $DBInstanceId --output json | ConvertFrom-Json
        $cacheInfo = aws elasticache describe-cache-clusters --cache-cluster-id $CacheClusterId --show-cache-node-info --output json | ConvertFrom-Json
        
        $db = $rdsInfo.DBInstances[0]
        $cache = $cacheInfo.CacheClusters[0]
        
        if ($db.DBInstanceStatus -eq "available" -and $cache.CacheClusterStatus -eq "available") {
            Write-Host "  🔄 Updating environment file with actual endpoints..." -ForegroundColor Yellow
            
            $content = Get-Content $envFile
            $newContent = $content -replace "DATABASE_URL=postgresql://.*", "DATABASE_URL=postgresql://bstreamadmin:YOUR_PASSWORD@$($db.Endpoint.Address):$($db.Endpoint.Port)/postgres"
            $newContent = $newContent -replace "REDIS_URL=redis://.*", "REDIS_URL=redis://$($cache.CacheNodes[0].Endpoint.Address):$($cache.CacheNodes[0].Endpoint.Port)"
            
            $newContent | Set-Content "$envFile.updated"
            Write-Host "  ✅ Updated environment file created: $envFile.updated" -ForegroundColor Green
            Write-Host "  📝 Remember to replace YOUR_PASSWORD with your actual database password" -ForegroundColor Cyan
        }
    } catch {
        Write-Host "  ⚠️  Could not update environment file: Resources may not be ready yet" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ❌ Environment file not found: $envFile" -ForegroundColor Red
}

Write-Host "`n🎯 Next Steps:" -ForegroundColor Blue
Write-Host "1. Ensure all resources show 'available' status" -ForegroundColor Gray
Write-Host "2. Update your environment file with actual endpoints and passwords" -ForegroundColor Gray
Write-Host "3. Run database migrations: npm run db:migrate:aws" -ForegroundColor Gray
Write-Host "4. Test your application with AWS resources" -ForegroundColor Gray

Write-Host "`n💡 Useful Commands:" -ForegroundColor Blue
Write-Host "  Check this status again: .\scripts\aws-status.ps1 -Environment $Environment" -ForegroundColor Gray
Write-Host "  Migrate database: npm run db:migrate:aws" -ForegroundColor Gray
Write-Host "  Test AWS connection: npm run test:aws" -ForegroundColor Gray
