#!/bin/bash
# Deploy ALM Kawaii Quiz to p0qp0q.com

echo "🚀 Deploying ALM Kawaii Quiz to p0qp0q.com..."

# SSH connection details
SSH_HOST="p0qp0q.com"
SSH_USER="ubuntu"
REMOTE_DIR="/var/www/html/alm-kawaii-quiz"

# Create deployment directory
DEPLOY_DIR="kawaii-quiz-deploy"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# Copy necessary files
echo "📦 Preparing files..."
cp index-modal.html $DEPLOY_DIR/index.html
cp app-modal-quiz.js $DEPLOY_DIR/
cp styles-modal.css $DEPLOY_DIR/
cp generate-quiz.php $DEPLOY_DIR/
cp config.php $DEPLOY_DIR/
cp -r *.php $DEPLOY_DIR/ 2>/dev/null || true

# Deploy via SSH
echo "📡 Uploading to server..."
ssh $SSH_USER@$SSH_HOST "sudo rm -rf $REMOTE_DIR && sudo mkdir -p $REMOTE_DIR"
scp -r $DEPLOY_DIR/* $SSH_USER@$SSH_HOST:/tmp/kawaii-quiz/
ssh $SSH_USER@$SSH_HOST "sudo cp -r /tmp/kawaii-quiz/* $REMOTE_DIR/ && sudo chown -R www-data:www-data $REMOTE_DIR && rm -rf /tmp/kawaii-quiz"

# Clean up
rm -rf $DEPLOY_DIR

echo "✅ Deployment complete!"
echo "🌐 Quiz available at: https://p0qp0q.com/alm-kawaii-quiz/"
echo "🎮 Test in ALM modal: ?modal=alm-kawaii-quiz/index.html"