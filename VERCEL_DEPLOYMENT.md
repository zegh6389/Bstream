# Vercel Deployment Guide

## Steps to Deploy to Vercel:

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy your app:
   ```bash
   vercel --prod
   ```

## Environment Variables to Set in Vercel:
Copy all variables from your .env.production file into Vercel's environment variables section:

- DATABASE_URL
- REDIS_URL  
- AWS_S3_BUCKET
- AWS_S3_BACKUP_BUCKET
- AWS_S3_REGION
- NEXTAUTH_URL (update to your Vercel domain)
- NEXTAUTH_SECRET

## Benefits:
✅ Automatic deployments from Git
✅ CDN and edge functions
✅ Easy domain setup
✅ Built for Next.js

## Cost: 
- Free tier available
- Pro: $20/month per team member
