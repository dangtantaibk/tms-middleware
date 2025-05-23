#!/bin/bash

# This script simplifies the deployment process
# Usage: ./deploy.sh [dev|prod]

# Default to dev if no environment specified
ENV=${1:-dev}

echo "Deploying to $ENV environment..."

# Pull latest code
echo "Pulling latest code..."
git pull

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the application
echo "Building application..."
npm run build

if [ "$ENV" = "prod" ]; then
  # Production deployment
  echo "Stopping existing containers..."
  npm run docker:down

  echo "Building new containers..."
  npm run docker:rebuild

  echo "Applying database migrations..."
  npm run db:migrate
else
  # Development deployment
  echo "Starting development environment..."
  npm run docker:up
  
  echo "Starting application in development mode..."
  npm run start:dev
fi

echo "Deployment complete!"
