# 🚀 Complete Vercel Deployment Guide

## Step 1: Connect to Vercel

1. **Visit**: https://vercel.com/signup
2. **Sign up** with your GitHub account (same one you used for this repo)
3. **Connect your GitHub repository**: Select "Bstream" repository

## Step 2: Configure Environment Variables

In your Vercel project dashboard, go to **Settings > Environment Variables** and add these from your `.env.production` file:

### Database & Infrastructure:
```
DATABASE_URL = postgresql://bstreamadmin:a_very_secure_password_123@bstream-db-production.cr8y6i6c8ldx.ca-central-1.rds.amazonaws.com:5432/postgres
REDIS_URL = redis://bstream-cache-production.jqg6ur.0001.cac1.cache.amazonaws.com:6379
```

### AWS Configuration:
```
AWS_S3_BUCKET = bstream-files-production
AWS_S3_BACKUP_BUCKET = bstream-backups-production
AWS_S3_REGION = ca-central-1
AWS_ACCESS_KEY_ID = (your AWS access key)
AWS_SECRET_ACCESS_KEY = (your AWS secret key)
```

### Authentication:
```
NEXTAUTH_URL = https://your-vercel-app.vercel.app
NEXTAUTH_SECRET = (generate with: openssl rand -base64 32)
```

### OAuth Providers (Optional):
```
GOOGLE_CLIENT_ID = (your Google OAuth client ID)
GOOGLE_CLIENT_SECRET = (your Google OAuth client secret)
GITHUB_CLIENT_ID = (your GitHub OAuth client ID)
GITHUB_CLIENT_SECRET = (your GitHub OAuth client secret)
```

## Step 3: Deploy

Once you've connected your repo and added environment variables:

1. **Push to GitHub** (if you haven't already)
2. **Vercel will automatically deploy** from your `master` branch
3. **Wait for deployment** to complete (~2-3 minutes)

## Step 4: Configure Custom Domain (Optional)

1. In Vercel dashboard → **Settings > Domains**
2. Add your custom domain
3. Update `NEXTAUTH_URL` to use your custom domain

## Step 5: Test Your Live App

Your app will be available at: `https://your-project-name.vercel.app`

Test these features:
- ✅ Homepage loads
- ✅ Database connection works
- ✅ Redis caching works
- ✅ User registration/login
- ✅ File uploads to S3

## Alternative: Manual CLI Deployment

If you prefer CLI deployment:

```bash
# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Follow prompts to configure project
```

## 🎯 Expected Results:

- **Build Time**: ~3-5 minutes
- **Deploy URL**: `https://bstream-[random].vercel.app`
- **AWS Integration**: Fully functional with your RDS, Redis, and S3
- **Performance**: Fast global CDN
- **SSL**: Automatic HTTPS

## 🔧 Post-Deployment:

1. **Update OAuth Providers** with your new production URL
2. **Test all authentication flows**
3. **Monitor AWS costs** in console
4. **Set up domain** if desired

Your AWS infrastructure is ready, your app builds successfully - you're just one deployment away from being live! 🚀
