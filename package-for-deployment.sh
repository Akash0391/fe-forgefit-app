#!/bin/bash

# Script to package forgefit-frontend for deployment with node_modules
# This builds locally and packages everything for the server
# Server only needs to extract and run 'npm run start'

set -e

echo "📦 Packaging ForgeFit Frontend for deployment (local build)..."

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Install all dependencies (including devDependencies for building)
if [ ! -d "node_modules" ]; then
    echo "📥 Installing all dependencies (including dev dependencies for building)..."
    npm install
else
    echo "✅ node_modules found"
fi

# Build the application locally
echo "🔨 Building application locally..."
npm run build

# Verify .next folder exists
if [ ! -d ".next" ]; then
    echo "❌ Error: Build failed - .next folder not found"
    exit 1
fi

echo "✅ Build completed successfully"

# Create tar archive (includes .next build folder)
OUTPUT_FILE="../forgefit-frontend-deploy-$(date +%Y%m%d-%H%M%S).tar.gz"
echo "📦 Creating archive: $OUTPUT_FILE"

tar -czf "$OUTPUT_FILE" \
  --exclude='.git' \
  --exclude='*.log' \
  --exclude='.env.local' \
  --exclude='.env.development' \
  --exclude='node_modules/.cache' \
  --exclude='node_modules/.bin/.cache' \
  --exclude='.next/cache' \
  .

# Get file size
FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
echo "✅ Package created: $OUTPUT_FILE ($FILE_SIZE)"
echo ""
echo "📋 Next steps on server:"
echo "   1. Transfer $OUTPUT_FILE to your server"
echo "   2. cd /var/www/forgefit-frontend"
echo "   3. ./extract-on-server.sh /path/to/forgefit-frontend-deploy-*.tar.gz"
echo "   4. npm run start"
echo ""
echo "ℹ️  Note: The package includes:"
echo "   - node_modules (with production dependencies)"
echo "   - .next (pre-built application)"
echo "   - All source files and configs"
echo "   Server will NOT need to build - just extract and start!"

