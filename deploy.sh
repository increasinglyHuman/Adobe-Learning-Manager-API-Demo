#!/bin/bash
# Deploy ALM Quiz to p0qp0q.com/alm-quiz/

echo "Deploying ALM Quiz to p0qp0q.com..."

# Create a deployment directory
DEPLOY_DIR="alm-quiz-deploy"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# Copy files
cp index.html $DEPLOY_DIR/
cp app.js $DEPLOY_DIR/
cp styles.css $DEPLOY_DIR/
cp README.md $DEPLOY_DIR/

# Create tarball
tar -czf alm-quiz-deploy.tar.gz $DEPLOY_DIR/

echo "Created alm-quiz-deploy.tar.gz"
echo "Upload this file to the server and extract it in the web root"
echo ""
echo "On the server, run:"
echo "  tar -xzf alm-quiz-deploy.tar.gz"
echo "  rm -rf /var/www/html/alm-quiz"
echo "  mv alm-quiz-deploy /var/www/html/alm-quiz"
echo ""
echo "The quiz will be available at: https://p0qp0q.com/alm-quiz/"

# Clean up
rm -rf $DEPLOY_DIR