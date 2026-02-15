#!/bin/bash

# AWS CLI Script to Add CloudFront Cache Behavior for /admin/*
# This proxies /admin/* requests to your API Gateway

# CONFIGURATION - UPDATE THESE VALUES
DISTRIBUTION_ID="E2K1TDXQD4ZLPW"  # Find in CloudFront console
API_GATEWAY_DOMAIN="5cvv7zff4i.execute-api.us-east-1.amazonaws.com"
API_GATEWAY_ORIGIN_ID="api-gateway-admin"  # Unique ID for this origin

echo "Step 1: Getting current CloudFront distribution config..."

# Get current distribution config
aws cloudfront get-distribution-config \
  --id $DISTRIBUTION_ID \
  --output json > distribution-config.json

# Extract the current ETag (required for updates)
ETAG=$(jq -r '.ETag' distribution-config.json)
echo "Current ETag: $ETAG"

# Extract just the DistributionConfig
jq '.DistributionConfig' distribution-config.json > config-only.json

echo "Step 2: Adding new origin for API Gateway..."

# Add new origin to the Origins array
jq --arg domain "$API_GATEWAY_DOMAIN" --arg id "$API_GATEWAY_ORIGIN_ID" \
  '.Origins.Items += [{
    "Id": $id,
    "DomainName": $domain,
    "OriginPath": "/prod",
    "CustomHeaders": {
      "Quantity": 0
    },
    "CustomOriginConfig": {
      "HTTPPort": 80,
      "HTTPSPort": 443,
      "OriginProtocolPolicy": "https-only",
      "OriginSslProtocols": {
        "Quantity": 3,
        "Items": ["TLSv1", "TLSv1.1", "TLSv1.2"]
      },
      "OriginReadTimeout": 30,
      "OriginKeepaliveTimeout": 5
    },
    "ConnectionAttempts": 3,
    "ConnectionTimeout": 10,
    "OriginShield": {
      "Enabled": false
    }
  }] | .Origins.Quantity += 1' config-only.json > config-with-origin.json

echo "Step 3: Adding cache behavior for /admin/*..."

# Add new cache behavior
jq --arg origin_id "$API_GATEWAY_ORIGIN_ID" \
  '.CacheBehaviors.Items += [{
    "PathPattern": "/admin/*",
    "TargetOriginId": $origin_id,
    "TrustedSigners": {
      "Enabled": false,
      "Quantity": 0
    },
    "TrustedKeyGroups": {
      "Enabled": false,
      "Quantity": 0
    },
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 7,
      "Items": ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
      "CachedMethods": {
        "Quantity": 2,
        "Items": ["GET", "HEAD"]
      }
    },
    "SmoothStreaming": false,
    "Compress": true,
    "LambdaFunctionAssociations": {
      "Quantity": 0
    },
    "FunctionAssociations": {
      "Quantity": 0
    },
    "FieldLevelEncryptionId": "",
    "CachePolicyId": "4135ea2d-6df8-44a3-9df3-4b5a84be39ad",
    "OriginRequestPolicyId": "216adef6-5c7f-47e4-b989-5492eafa07d3"
  }] | .CacheBehaviors.Quantity += 1' config-with-origin.json > config-final.json

echo "Step 4: Updating CloudFront distribution..."

# Update the distribution
aws cloudfront update-distribution \
  --id $DISTRIBUTION_ID \
  --distribution-config file://config-final.json \
  --if-match $ETAG

if [ $? -eq 0 ]; then
  echo "✅ SUCCESS! Cache behavior added."
  echo "CloudFront is now deploying the changes (takes 5-15 minutes)"
  echo ""
  echo "To check deployment status:"
  echo "aws cloudfront get-distribution --id $DISTRIBUTION_ID --query 'Distribution.Status'"
  echo ""
  echo "When Status shows 'Deployed', your /admin/* endpoints will work!"
else
  echo "❌ ERROR: Failed to update distribution"
  echo "Check the error message above"
fi

# Cleanup
rm -f distribution-config.json config-only.json config-with-origin.json config-final.json

echo ""
echo "IMPORTANT CACHE POLICY IDs used:"
echo "- CachePolicyId: 4135ea2d-6df8-44a3-9df3-4b5a84be39ad (CachingDisabled)"
echo "- OriginRequestPolicyId: 216adef6-5c7f-47e4-b989-5492eafa07d3 (AllViewer)"
echo ""
echo "These policies:"
echo "  ✅ Forward all cookies (including id_token)"
echo "  ✅ Forward all headers"
echo "  ✅ Forward all query strings"
echo "  ✅ Disable caching (important for authenticated endpoints)"