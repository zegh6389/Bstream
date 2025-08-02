# AWS EC2 Deployment Guide

## Steps to Deploy to AWS EC2:

1. **Launch EC2 Instance:**
   - Choose Ubuntu 22.04 LTS
   - t3.small or larger for production
   - Configure security groups (ports 80, 443, 22)

2. **Connect and Setup:**
   ```bash
   # Install Node.js and PM2
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo npm install -g pm2

   # Clone your repository
   git clone https://github.com/zegh6389/Bstream.git
   cd Bstream
   
   # Install dependencies and build
   npm install
   npm run build
   ```

3. **Environment Setup:**
   ```bash
   # Copy your production environment file
   cp .env.production .env.local
   
   # Start the application with PM2
   pm2 start ecosystem.config.js --env production
   pm2 save
   pm2 startup
   ```

4. **Setup Nginx (Optional):**
   ```bash
   sudo apt install nginx
   # Configure reverse proxy for your app
   ```

## Benefits:
✅ Full control over server
✅ Can run background processes
✅ Custom domains easy to setup
✅ Cost-effective for high traffic

## Cost:
- t3.small: ~$17/month
- t3.medium: ~$33/month
- Plus data transfer costs
