#!/bin/bash
# News BLKOUT - systemd Deployment Script
# Run with: sudo bash DEPLOY_SYSTEMD.sh

set -e  # Exit on error

echo "🚀 Deploying News BLKOUT with systemd..."
echo ""

# Step 1: Install systemd service
echo "📦 Step 1: Installing systemd service..."
cp /tmp/news-blkout.service /etc/systemd/system/news-blkout.service
systemctl daemon-reload
echo "✅ systemd service installed"
echo ""

# Step 2: Enable and start service
echo "▶️  Step 2: Starting news-blkout service..."
systemctl enable news-blkout
systemctl start news-blkout
sleep 5
echo "✅ Service started"
echo ""

# Step 3: Check service status
echo "🔍 Step 3: Checking service status..."
systemctl status news-blkout --no-pager || true
echo ""

# Step 4: Verify container is running
echo "🐳 Step 4: Verifying Docker container..."
docker ps | grep news-blkout
echo "✅ Container running"
echo ""

# Step 5: Install nginx configuration
echo "🌐 Step 5: Installing nginx proxy configuration..."
if [ -d "/etc/nginx/sites-available" ]; then
    cp /tmp/news.blkoutuk.cloud.nginx /etc/nginx/sites-available/news.blkoutuk.cloud
    ln -sf /etc/nginx/sites-available/news.blkoutuk.cloud /etc/nginx/sites-enabled/
    echo "✅ nginx configuration installed"
else
    echo "⚠️  sites-available directory not found, skipping nginx config"
    echo "   You may need to configure nginx manually"
fi
echo ""

# Step 6: Test and reload nginx
echo "🔧 Step 6: Testing and reloading nginx..."
if command -v nginx &> /dev/null; then
    nginx -t
    systemctl reload nginx
    echo "✅ nginx reloaded"
else
    echo "⚠️  nginx not found on host"
fi
echo ""

# Step 7: Final verification
echo "✅ Deployment Complete!"
echo ""
echo "📊 Status Check:"
echo "  systemd service: $(systemctl is-active news-blkout)"
echo "  Docker container: $(docker ps | grep news-blkout > /dev/null && echo '✅ Running' || echo '❌ Not running')"
echo ""
echo "🔗 Next Steps:"
echo "  1. Test: curl -I http://news.blkoutuk.cloud"
echo "  2. Configure SSL: sudo certbot --nginx -d news.blkoutuk.cloud"
echo "  3. Monitor logs: sudo journalctl -u news-blkout -f"
echo ""
