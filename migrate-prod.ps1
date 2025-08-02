# Production Database Migration Script
$env:DATABASE_URL="postgresql://bstreamadmin:a_very_secure_password_123@bstream-db-production.cr8y6i6c8ldx.ca-central-1.rds.amazonaws.com:5432/postgres"

Write-Host "Setting up production database..."
Write-Host "Database URL: $env:DATABASE_URL"

Write-Host "Generating Prisma client..."
npx prisma generate --schema=prisma/schema.postgresql.prisma

Write-Host "Pushing schema to database..."
npx prisma db push --schema=prisma/schema.postgresql.prisma --accept-data-loss

Write-Host "Database setup complete!"
