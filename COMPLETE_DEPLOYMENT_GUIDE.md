# Complete Deployment Guide - Your Strategy

This guide follows your deployment strategy: Install tools → Create configs → Extract → Verify → Rebuild if corrupted

---

## 📋 Phase 1: Server Setup (One-Time)

### 1.1 Install NVM (Node Version Manager)
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm --version
```

### 1.2 Install Node.js (via NVM)
```bash
nvm install 20
nvm use 20
nvm alias default 20
node --version
npm --version
```

### 1.3 Install PM2 (Process Manager)
```bash
npm install -g pm2
pm2 --version
```

### 1.4 Install Nginx
```bash
sudo apt update
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
nginx -v
```

---

## 📋 Phase 2: Create Configuration Files

### 2.1 Create PM2 Ecosystem Config

Create `/var/www/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'forgefit-backend',
      script: './forgefit-backend/src/server.js',
      cwd: '/var/www/forgefit-backend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: '/var/www/logs/backend-error.log',
      out_file: '/var/www/logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    },
    {
      name: 'forgefit-frontend',
      script: 'npm',
      args: 'run start',
      cwd: '/var/www/forgefit-frontend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/www/logs/frontend-error.log',
      out_file: '/var/www/logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    }
  ]
};
```

### 2.2 Create Single Nginx Config (Frontend + Backend with SSL)

Create `/etc/nginx/sites-available/forgefit`:

```bash
# Copy the config file to nginx
sudo cp /var/www/nginx-forgefit.conf /etc/nginx/sites-available/forgefit

# Edit to update your domain names
sudo nano /etc/nginx/sites-available/forgefit
# Replace "yourdomain.com" with your actual domain
```

The configuration includes:
- **HTTPS server** (port 443) with SSL certificates
- **Frontend** at `/` → `localhost:3000`
- **Backend API** at `/api/` → `localhost:5000`
- **HTTP to HTTPS redirects** for both www and non-www
- **Static asset caching** for better performance

### 2.3 Setup SSL Certificates (Let's Encrypt)

If you don't have SSL certificates yet:

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d shinypearls.com -d www.shinypearls.com

# Certbot will automatically update your nginx config with SSL paths
# It will also set up automatic renewal
```

**Note:** Make sure your domain DNS is pointing to your server before running certbot.

### 2.4 Enable Nginx Site
```bash
# Enable the single config file
sudo ln -s /etc/nginx/sites-available/forgefit /etc/nginx/sites-enabled/

# Remove default nginx site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

**Important:** After getting SSL certificates with certbot, the SSL certificate paths in the config will be automatically updated. If you're setting up manually, make sure the paths in the config match your certificate locations.

### 2.5 Create Logs Directory
```bash
mkdir -p /var/www/logs
```

---

## 📦 Phase 3: Local Build & Package

### 3.1 Build Frontend Locally
```bash
cd forgefit-frontend

# Install dependencies
npm install

# Build the application
npm run build

# Verify build
ls -la .next
```

### 3.2 Package Frontend
```bash
# Create tar archive (use tar, NOT zip!)
tar -czf ../forgefit-frontend-deploy.tar.gz \
  --exclude='.git' \
  --exclude='*.log' \
  --exclude='.env.local' \
  --exclude='.env.development' \
  --exclude='node_modules/.cache' \
  --exclude='node_modules/.bin/.cache' \
  --exclude='.next/cache' \
  .

# Check file size
ls -lh ../forgefit-frontend-deploy.tar.gz
```

### 3.3 Package Backend (if needed)
```bash
cd forgefit-backend

# Install dependencies
npm install --production

# Create tar archive
tar -czf ../forgefit-backend-deploy.tar.gz \
  --exclude='.git' \
  --exclude='*.log' \
  --exclude='.env' \
  --exclude='node_modules/.cache' \
  .

# Check file size
ls -lh ../forgefit-backend-deploy.tar.gz
```

---

## 🚀 Phase 4: Deploy to Server

### 4.1 Transfer Files to Server
```bash
# From your local machine
scp forgefit-frontend-deploy.tar.gz gcp-akash@shinypearls-prod-in:/var/www/
scp forgefit-backend-deploy.tar.gz gcp-akash@shinypearls-prod-in:/var/www/
```

### 4.2 Extract Frontend on Server
```bash
cd /var/www/forgefit-frontend

# Remove old files
rm -rf node_modules .next

# Extract
tar -xzf /var/www/forgefit-frontend-deploy.tar.gz

# Fix permissions
chmod -R u+r,go+r node_modules
find node_modules/.bin -type f -exec chmod +x {} \;
```

### 4.3 Extract Backend on Server
```bash
cd /var/www/forgefit-backend

# Remove old files
rm -rf node_modules

# Extract
tar -xzf /var/www/forgefit-backend-deploy.tar.gz

# Fix permissions
chmod -R u+r,go+r node_modules
find node_modules/.bin -type f -exec chmod +x {} \;
```

---

## ✅ Phase 5: Verify & Check for Corruption

### 5.1 Verify Frontend
```bash
cd /var/www/forgefit-frontend

# Check critical Next.js file
if [ -f "node_modules/next/server/require-hook.js" ] || [ -f "node_modules/next/server/require-hook" ]; then
    echo "✅ Frontend node_modules OK"
else
    echo "❌ Frontend node_modules CORRUPTED - Missing require-hook"
    echo "   → Delete and rebuild locally, then re-upload"
fi

# Check build folder
if [ -d ".next" ] && [ -f ".next/BUILD_ID" ]; then
    echo "✅ Frontend .next build OK"
else
    echo "❌ Frontend .next CORRUPTED - Missing build files"
    echo "   → Delete and rebuild locally, then re-upload"
fi
```

### 5.2 Verify Backend
```bash
cd /var/www/forgefit-backend

# Check if main server file exists
if [ -f "src/server.js" ]; then
    echo "✅ Backend source files OK"
else
    echo "❌ Backend source files CORRUPTED"
    echo "   → Delete and rebuild locally, then re-upload"
fi

# Check node_modules
if [ -d "node_modules/express" ]; then
    echo "✅ Backend node_modules OK"
else
    echo "❌ Backend node_modules CORRUPTED"
    echo "   → Delete and rebuild locally, then re-upload"
fi
```

### 5.3 Quick Verification Script
Create `/var/www/verify-deployment.sh`:

```bash
#!/bin/bash

echo "🔍 Verifying deployment..."

# Frontend checks
cd /var/www/forgefit-frontend
FRONTEND_OK=true

if [ ! -f "node_modules/next/server/require-hook.js" ] && [ ! -f "node_modules/next/server/require-hook" ]; then
    echo "❌ Frontend: node_modules CORRUPTED"
    FRONTEND_OK=false
fi

if [ ! -d ".next" ] || [ ! -f ".next/BUILD_ID" ]; then
    echo "❌ Frontend: .next CORRUPTED"
    FRONTEND_OK=false
fi

if [ "$FRONTEND_OK" = true ]; then
    echo "✅ Frontend: All checks passed"
fi

# Backend checks
cd /var/www/forgefit-backend
BACKEND_OK=true

if [ ! -f "src/server.js" ]; then
    echo "❌ Backend: Source files CORRUPTED"
    BACKEND_OK=false
fi

if [ ! -d "node_modules/express" ]; then
    echo "❌ Backend: node_modules CORRUPTED"
    BACKEND_OK=false
fi

if [ "$BACKEND_OK" = true ]; then
    echo "✅ Backend: All checks passed"
fi

if [ "$FRONTEND_OK" = true ] && [ "$BACKEND_OK" = true ]; then
    echo ""
    echo "✅ All checks passed! Ready to start."
    exit 0
else
    echo ""
    echo "❌ Corruption detected! Rebuild locally and re-upload."
    exit 1
fi
```

Make it executable:
```bash
chmod +x /var/www/verify-deployment.sh
```

---

## 🔄 Phase 6: If Corruption Detected - Rebuild Process

**Simple workflow:** Delete on server → Rebuild locally → Re-upload

### 6.1 On Server - Delete Corrupted Files

When corruption is detected, simply delete the corrupted directories:

**If Frontend is corrupted:**
```bash
cd /var/www/forgefit-frontend
rm -rf node_modules .next
```

**If Backend is corrupted:**
```bash
cd /var/www/forgefit-backend
rm -rf node_modules
```

**If both are corrupted:**
```bash
cd /var/www/forgefit-frontend
rm -rf node_modules .next

cd /var/www/forgefit-backend
rm -rf node_modules
```

### 6.2 On Local Machine - Rebuild Frontend

```bash
cd forgefit-frontend

# Clean everything
rm -rf node_modules .next package-lock.json

# Fresh install
npm install

# Fresh build
npm run build

# Verify build
ls -la .next

# Re-create tar archive
tar -czf ../forgefit-frontend-deploy.tar.gz \
  --exclude='.git' \
  --exclude='*.log' \
  --exclude='.env.local' \
  --exclude='.env.development' \
  --exclude='node_modules/.cache' \
  --exclude='node_modules/.bin/.cache' \
  --exclude='.next/cache' \
  .
```

### 6.3 On Local Machine - Rebuild Backend

```bash
cd forgefit-backend

# Clean everything
rm -rf node_modules package-lock.json

# Fresh install
npm install --production

# Re-create tar archive
tar -czf ../forgefit-backend-deploy.tar.gz \
  --exclude='.git' \
  --exclude='*.log' \
  --exclude='.env' \
  --exclude='node_modules/.cache' \
  .
```

### 6.4 Re-upload to Server

```bash
# Transfer the rebuilt archives
scp forgefit-frontend-deploy.tar.gz gcp-akash@shinypearls-prod-in:/var/www/
scp forgefit-backend-deploy.tar.gz gcp-akash@shinypearls-prod-in:/var/www/
```

### 6.5 On Server - Extract and Verify Again

```bash
# Extract Frontend
cd /var/www/forgefit-frontend
tar -xzf /var/www/forgefit-frontend-deploy.tar.gz
chmod -R u+r,go+r node_modules
find node_modules/.bin -type f -exec chmod +x {} \;

# Extract Backend
cd /var/www/forgefit-backend
tar -xzf /var/www/forgefit-backend-deploy.tar.gz
chmod -R u+r,go+r node_modules
find node_modules/.bin -type f -exec chmod +x {} \;

# Verify again
/var/www/verify-deployment.sh
```

If verification passes, proceed to Phase 7 to start services.

---

## 🎯 Phase 7: Start Services

### 7.1 Set Up Environment Variables

**Frontend** - `/var/www/forgefit-frontend/.env.production`:
```env
NEXT_PUBLIC_API_URL=http://api.yourdomain.com
```

**Backend** - `/var/www/forgefit-backend/.env`:
```env
PORT=5000
NODE_ENV=production
FRONTEND_URL=http://yourdomain.com
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SESSION_SECRET=your_session_secret
MONGODB_URI=your_mongodb_uri
```

### 7.2 Start with PM2
```bash
cd /var/www

# Start both apps
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it outputs

# Check status
pm2 status

# View logs
pm2 logs
```

### 7.3 PM2 Management Commands
```bash
# View status
pm2 status

# View logs
pm2 logs
pm2 logs forgefit-frontend
pm2 logs forgefit-backend

# Restart
pm2 restart all
pm2 restart forgefit-frontend
pm2 restart forgefit-backend

# Stop
pm2 stop all
pm2 stop forgefit-frontend

# Delete from PM2
pm2 delete forgefit-frontend
pm2 delete forgefit-backend

# Monitor
pm2 monit
```

---

## 📝 Quick Reference Commands

### Complete Deployment Flow
```bash
# 1. Local: Build and package
cd forgefit-frontend && npm install && npm run build
tar -czf ../forgefit-frontend-deploy.tar.gz --exclude='.git' --exclude='*.log' --exclude='.env.local' --exclude='node_modules/.cache' --exclude='.next/cache' .

# 2. Transfer
scp forgefit-frontend-deploy.tar.gz user@server:/var/www/

# 3. Server: Extract and verify
cd /var/www/forgefit-frontend
rm -rf node_modules .next
tar -xzf /var/www/forgefit-frontend-deploy.tar.gz
chmod -R u+r,go+r node_modules && find node_modules/.bin -type f -exec chmod +x {} \;
/var/www/verify-deployment.sh

# 4. If OK: Start
pm2 restart ecosystem.config.js
```

### If Corruption Detected
```bash
# STEP 1: On Server - Delete corrupted files
cd /var/www/forgefit-frontend
rm -rf node_modules .next

# STEP 2: On Local - Rebuild
cd forgefit-frontend
rm -rf node_modules .next package-lock.json
npm install && npm run build
tar -czf ../forgefit-frontend-deploy.tar.gz --exclude='.git' --exclude='*.log' --exclude='.env.local' --exclude='node_modules/.cache' --exclude='.next/cache' .

# STEP 3: Re-upload
scp forgefit-frontend-deploy.tar.gz user@server:/var/www/

# STEP 4: On Server - Extract and verify
cd /var/www/forgefit-frontend
tar -xzf /var/www/forgefit-frontend-deploy.tar.gz
chmod -R u+r,go+r node_modules && find node_modules/.bin -type f -exec chmod +x {} \;
/var/www/verify-deployment.sh
```

---

## 🔍 Troubleshooting

### PM2 Issues
```bash
# Check PM2 logs
pm2 logs --lines 100

# Restart specific app
pm2 restart forgefit-frontend

# Check if apps are running
pm2 list
```

### Nginx Issues
```bash
# Test config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Check nginx status
sudo systemctl status nginx

# View nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Port Conflicts
```bash
# Check what's using port 3000
sudo lsof -i :3000

# Check what's using port 5000
sudo lsof -i :5000
```

---

## ✅ Deployment Checklist

- [ ] NVM, Node.js, PM2, Nginx installed
- [ ] PM2 ecosystem.config.js created
- [ ] Nginx configs created and enabled
- [ ] Frontend built locally
- [ ] Frontend packaged with tar
- [ ] Backend packaged with tar
- [ ] Files transferred to server
- [ ] Files extracted on server
- [ ] Permissions fixed
- [ ] Verification script passed
- [ ] Environment variables set
- [ ] PM2 started both apps
- [ ] PM2 saved and startup configured
- [ ] Nginx reloaded
- [ ] Services accessible via domain

