# 🌐 Route 53 DNS Setup for Bstream
# This script helps set up custom domain with Route 53

param(
    [Parameter(Mandatory=$true)]
    [string]$DomainName,
    
    [string]$Environment = "production",
    [string]$Region = "us-east-1",
    
    [Parameter(Mandatory=$true)]
    [string]$ApplicationURL  # e.g., your-app.vercel.app or ALB DNS name
)

Write-Host "🌐 Setting up Route 53 DNS for Bstream" -ForegroundColor Green
Write-Host "Domain: $DomainName" -ForegroundColor Yellow
Write-Host "Application URL: $ApplicationURL" -ForegroundColor Yellow
Write-Host "Environment: $Environment" -ForegroundColor Yellow

# Check if domain is already registered in Route 53
Write-Host "`n🔍 Checking domain registration..." -ForegroundColor Blue

try {
    $hostedZones = aws route53 list-hosted-zones --output json | ConvertFrom-Json
    $existingZone = $hostedZones.HostedZones | Where-Object { $_.Name -eq "$DomainName." }
    
    if ($existingZone) {
        Write-Host "✅ Domain found in Route 53: $($existingZone.Id)" -ForegroundColor Green
        $hostedZoneId = $existingZone.Id -replace "/hostedzone/", ""
    } else {
        Write-Host "❌ Domain not found in Route 53" -ForegroundColor Red
        Write-Host "Please ensure your domain is:" -ForegroundColor Yellow
        Write-Host "1. Registered through Route 53, OR" -ForegroundColor Gray
        Write-Host "2. Has nameservers pointing to Route 53" -ForegroundColor Gray
        
        $createZone = Read-Host "`nWould you like to create a hosted zone for $DomainName? (y/N)"
        if ($createZone -eq 'y' -or $createZone -eq 'Y') {
            Write-Host "Creating hosted zone..." -ForegroundColor Yellow
            
            $hostedZoneResult = aws route53 create-hosted-zone `
                --name $DomainName `
                --caller-reference "bstream-$(Get-Date -Format 'yyyyMMdd-HHmmss')" `
                --hosted-zone-config "Comment=Bstream $Environment hosted zone" `
                --output json | ConvertFrom-Json
            
            $hostedZoneId = $hostedZoneResult.HostedZone.Id -replace "/hostedzone/", ""
            Write-Host "✅ Hosted zone created: $hostedZoneId" -ForegroundColor Green
            
            # Display nameservers
            Write-Host "`n📝 Important: Update your domain's nameservers to:" -ForegroundColor Cyan
            $hostedZoneResult.DelegationSet.NameServers | ForEach-Object {
                Write-Host "  $_" -ForegroundColor Yellow
            }
            Write-Host "`nThis step must be done at your domain registrar!" -ForegroundColor Red
        } else {
            Write-Host "Exiting. Please set up hosted zone first." -ForegroundColor Yellow
            exit 1
        }
    }
} catch {
    Write-Host "❌ Error checking Route 53: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Create A record for apex domain
Write-Host "`n📝 Creating DNS records..." -ForegroundColor Blue

# Determine record type based on application URL
$isAWS = $ApplicationURL -match "\.elb\.amazonaws\.com$" -or $ApplicationURL -match "\.amazonaws\.com$"
$recordType = if ($isAWS) { "ALIAS" } else { "CNAME" }

Write-Host "Record type: $recordType" -ForegroundColor Gray

# Create JSON for record changes
$changesBatch = @{
    Comment = "Bstream $Environment DNS setup"
    Changes = @(
        @{
            Action = "UPSERT"
            ResourceRecordSet = @{
                Name = $DomainName
                Type = if ($isAWS) { "A" } else { "CNAME" }
                TTL = if ($isAWS) { $null } else { 300 }
                ResourceRecords = if ($isAWS) { $null } else { @(@{ Value = $ApplicationURL }) }
                AliasTarget = if ($isAWS) {
                    @{
                        DNSName = $ApplicationURL
                        EvaluateTargetHealth = $false
                        HostedZoneId = "Z35SXDOTRQ7X7K"  # ALB zone ID for US East 1
                    }
                } else { $null }
            }
        },
        @{
            Action = "UPSERT"
            ResourceRecordSet = @{
                Name = "www.$DomainName"
                Type = if ($isAWS) { "A" } else { "CNAME" }
                TTL = if ($isAWS) { $null } else { 300 }
                ResourceRecords = if ($isAWS) { $null } else { @(@{ Value = $ApplicationURL }) }
                AliasTarget = if ($isAWS) {
                    @{
                        DNSName = $ApplicationURL
                        EvaluateTargetHealth = $false
                        HostedZoneId = "Z35SXDOTRQ7X7K"  # ALB zone ID for US East 1
                    }
                } else { $null }
            }
        }
    )
} | ConvertTo-Json -Depth 10

# Save to temp file and execute
$changesBatch | Out-File -FilePath "route53-changes.json" -Encoding UTF8

try {
    $changeResult = aws route53 change-resource-record-sets `
        --hosted-zone-id $hostedZoneId `
        --change-batch file://route53-changes.json `
        --output json | ConvertFrom-Json
    
    Write-Host "✅ DNS records created successfully" -ForegroundColor Green
    Write-Host "Change ID: $($changeResult.ChangeInfo.Id)" -ForegroundColor Gray
    Write-Host "Status: $($changeResult.ChangeInfo.Status)" -ForegroundColor Gray
    
    # Clean up temp file
    Remove-Item "route53-changes.json"
    
} catch {
    Write-Host "❌ Error creating DNS records: $($_.Exception.Message)" -ForegroundColor Red
    Remove-Item "route53-changes.json" -ErrorAction SilentlyContinue
    exit 1
}

# Check propagation
Write-Host "`n🌍 DNS Propagation Check:" -ForegroundColor Blue
Write-Host "It may take 5-10 minutes for DNS changes to propagate globally." -ForegroundColor Yellow

Write-Host "`n🔍 Test your domain:" -ForegroundColor Blue
Write-Host "  nslookup $DomainName" -ForegroundColor Gray
Write-Host "  nslookup www.$DomainName" -ForegroundColor Gray

# SSL Certificate recommendation
Write-Host "`n🔒 SSL Certificate Setup:" -ForegroundColor Blue
if ($isAWS) {
    Write-Host "For AWS ALB, use AWS Certificate Manager:" -ForegroundColor Yellow
    Write-Host "  aws acm request-certificate --domain-name $DomainName --subject-alternative-names www.$DomainName --validation-method DNS" -ForegroundColor Gray
} else {
    Write-Host "For external hosting (Vercel, Railway, etc.):" -ForegroundColor Yellow
    Write-Host "  SSL is usually handled automatically by the platform" -ForegroundColor Gray
    Write-Host "  Add your custom domain in the platform's dashboard" -ForegroundColor Gray
}

# Health check setup (optional)
Write-Host "`n❤️  Health Check Setup (Optional):" -ForegroundColor Blue
$setupHealthCheck = Read-Host "Set up Route 53 health check for $DomainName? (y/N)"
if ($setupHealthCheck -eq 'y' -or $setupHealthCheck -eq 'Y') {
    try {
        $healthCheckResult = aws route53 create-health-check `
            --caller-reference "bstream-health-$(Get-Date -Format 'yyyyMMdd-HHmmss')" `
            --health-check-config "Type=HTTPS,ResourcePath=/api/health,FullyQualifiedDomainName=$DomainName,Port=443,RequestInterval=30,FailureThreshold=3" `
            --output json | ConvertFrom-Json
        
        Write-Host "✅ Health check created: $($healthCheckResult.HealthCheck.Id)" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Health check creation failed: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host "`n🎉 Route 53 setup completed!" -ForegroundColor Green
Write-Host "`n📋 Summary:" -ForegroundColor Blue
Write-Host "  Domain: $DomainName" -ForegroundColor Gray
Write-Host "  Hosted Zone ID: $hostedZoneId" -ForegroundColor Gray
Write-Host "  Target: $ApplicationURL" -ForegroundColor Gray
Write-Host "  Record Type: $recordType" -ForegroundColor Gray

Write-Host "`n🔄 Next Steps:" -ForegroundColor Blue
Write-Host "1. Wait 5-10 minutes for DNS propagation" -ForegroundColor Gray
Write-Host "2. Test domain resolution: nslookup $DomainName" -ForegroundColor Gray
Write-Host "3. Update NEXTAUTH_URL to https://$DomainName" -ForegroundColor Gray
Write-Host "4. Set up SSL certificate if using AWS ALB" -ForegroundColor Gray
Write-Host "5. Update OAuth redirect URIs to new domain" -ForegroundColor Gray

Write-Host "`n💡 Monitoring:" -ForegroundColor Blue
Write-Host "  Check DNS status: aws route53 get-change --id $($changeResult.ChangeInfo.Id)" -ForegroundColor Gray
Write-Host "  Monitor health: AWS Route 53 Console → Health Checks" -ForegroundColor Gray
