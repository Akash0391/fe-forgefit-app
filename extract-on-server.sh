#!/bin/bash

# Script to extract and set up ForgeFit Frontend on production server
# Usage: ./extract-on-server.sh /path/to/forgefit-frontend-deploy.tar.gz

set -e

if [ -z "$1" ]; then
    echo "❌ Error: Please provide the path to the tar.gz file"
    echo "Usage: $0 /path/to/forgefit-frontend-deploy.tar.gz"
    exit 1
fi

TAR_FILE="$1"

if [ ! -f "$TAR_FILE" ]; then
    echo "❌ Error: File not found: $TAR_FILE"
    exit 1
fi

echo "📦 Extracting ForgeFit Frontend..."

# Get current directory (should be /var/www/forgefit-frontend)
CURRENT_DIR=$(pwd)
echo "📁 Current directory: $CURRENT_DIR"

# Backup existing files (optional)
if [ -d "node_modules" ] || [ -d ".next" ]; then
    echo "⚠️  Backing up existing node_modules and .next..."
    BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    [ -d "node_modules" ] && mv node_modules "$BACKUP_DIR/" 2>/dev/null || true
    [ -d ".next" ] && mv .next "$BACKUP_DIR/" 2>/dev/null || true
    echo "✅ Backup created in: $BACKUP_DIR"
fi

# Extract the archive
echo "📂 Extracting archive..."
tar -xzf "$TAR_FILE"

# Fix permissions
echo "🔧 Fixing permissions..."
chmod -R u+r,go+r node_modules 2>/dev/null || true
find node_modules/.bin -type f -exec chmod +x {} \; 2>/dev/null || true

# Verify critical files
echo "✅ Verifying installation..."
if [ -f "node_modules/next/server/require-hook.js" ] || [ -f "node_modules/next/server/require-hook" ]; then
    echo "✅ Next.js installation verified"
else
    echo "⚠️  Warning: Next.js require-hook not found. Installation may be incomplete."
    echo "   Check if node_modules was extracted correctly."
fi

# Check if .next exists (should be pre-built)
if [ -d ".next" ]; then
    echo "✅ Pre-built .next folder found - no build needed!"
    BUILD_NEEDED=false
else
    echo "⚠️  Warning: .next folder not found. Build may be required."
    echo "   This package should include a pre-built .next folder."
    BUILD_NEEDED=true
fi

echo ""
echo "✅ Extraction complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Set up environment variables (.env.local or .env.production)"
if [ "$BUILD_NEEDED" = true ]; then
    echo "   2. Build the application: npm run build"
    echo "   3. Start the server: npm run start"
else
    echo "   2. Start the server: npm run start (no build needed!)"
fi

