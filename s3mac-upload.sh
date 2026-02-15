#!/bin/bash

# Build the application
npm run build

# Remove everything from S3 bucket EXCEPT the /data folder
aws s3 rm s3://sstmi-admin-portal --recursive --exclude "data/*"

# Sync the new build to S3
aws s3 sync out/ s3://sstmi-admin-portal/

# List all files to verify (optional but helpful)
aws s3 ls s3://sstmi-admin-portal --recursive

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id E2K1TDXQD4ZLPW --paths "/*"