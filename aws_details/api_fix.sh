#!/bin/bash
# AWS CLI Script to UPDATE API Gateway CORS for credentials: 'include'
# This fixes the CORS error when using credentials: 'include'

set -e

REGION="us-east-1"
API_ID="5cvv7zff4i"  # Your existing API Gateway ID
ALLOWED_ORIGIN="https://admin.sstmi.org"  # Your frontend domain

echo "🔧 Updating CORS configuration for API Gateway: $API_ID"

# Get all resources
RESOURCES=$(aws apigateway get-resources \
    --rest-api-id $API_ID \
    --region $REGION \
    --output json)

# Extract resource IDs
LIST_USERS_ID=$(echo $RESOURCES | jq -r '.items[] | select(.path == "/admin/list-users") | .id')
CREATE_USER_ID=$(echo $RESOURCES | jq -r '.items[] | select(.path == "/admin/create-user") | .id')
UPDATE_USER_ID=$(echo $RESOURCES | jq -r '.items[] | select(.path == "/admin/update-user") | .id')
TOGGLE_STATUS_ID=$(echo $RESOURCES | jq -r '.items[] | select(.path == "/admin/toggle-user-status") | .id')
RESET_PASSWORD_ID=$(echo $RESOURCES | jq -r '.items[] | select(.path == "/admin/reset-password") | .id')
DELETE_USER_ID=$(echo $RESOURCES | jq -r '.items[] | select(.path == "/admin/delete-user") | .id')

echo "Found resource IDs:"
echo "  list-users: $LIST_USERS_ID"
echo "  create-user: $CREATE_USER_ID"
echo "  update-user: $UPDATE_USER_ID"
echo "  toggle-user-status: $TOGGLE_STATUS_ID"
echo "  reset-password: $RESET_PASSWORD_ID"
echo "  delete-user: $DELETE_USER_ID"

# Function to update CORS on a resource
update_cors() {
    local RESOURCE_ID=$1
    local RESOURCE_PATH=$2
    
    echo ""
    echo "📝 Updating CORS on $RESOURCE_PATH..."
    
    # Delete existing OPTIONS method if it exists
    aws apigateway delete-method \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --http-method OPTIONS \
        --region $REGION 2>/dev/null || true
    
    # Create OPTIONS method
    aws apigateway put-method \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --http-method OPTIONS \
        --authorization-type NONE \
        --region $REGION
    
    # Mock integration for OPTIONS
    aws apigateway put-integration \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --http-method OPTIONS \
        --type MOCK \
        --integration-http-method OPTIONS \
        --request-templates '{"application/json": "{\"statusCode\": 200}"}' \
        --region $REGION
    
    # Method response for OPTIONS
    aws apigateway put-method-response \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --http-method OPTIONS \
        --status-code 200 \
        --response-parameters '{
            "method.response.header.Access-Control-Allow-Headers": false,
            "method.response.header.Access-Control-Allow-Methods": false,
            "method.response.header.Access-Control-Allow-Origin": false,
            "method.response.header.Access-Control-Allow-Credentials": false
        }' \
        --region $REGION
    
    # Integration response for OPTIONS with specific origin
    aws apigateway put-integration-response \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --http-method OPTIONS \
        --status-code 200 \
        --response-parameters "{
            \"method.response.header.Access-Control-Allow-Headers\": \"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'\",
            \"method.response.header.Access-Control-Allow-Methods\": \"'GET,POST,OPTIONS'\",
            \"method.response.header.Access-Control-Allow-Origin\": \"'$ALLOWED_ORIGIN'\",
            \"method.response.header.Access-Control-Allow-Credentials\": \"'true'\"
        }" \
        --region $REGION
    
    echo "✅ CORS updated for $RESOURCE_PATH"
}

# Update CORS on all resources
update_cors $LIST_USERS_ID "/admin/list-users"
update_cors $CREATE_USER_ID "/admin/create-user"
update_cors $UPDATE_USER_ID "/admin/update-user"
update_cors $TOGGLE_STATUS_ID "/admin/toggle-user-status"
update_cors $RESET_PASSWORD_ID "/admin/reset-password"
update_cors $DELETE_USER_ID "/admin/delete-user"

# Deploy API
echo ""
echo "📝 Deploying API changes..."
aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name prod \
    --description "Updated CORS for credentials support" \
    --region $REGION

echo ""
echo "✅ =========================================="
echo "✅ CORS Configuration Updated!"
echo "✅ =========================================="
echo ""
echo "Changes made:"
echo "  - Access-Control-Allow-Origin: $ALLOWED_ORIGIN (no longer wildcard)"
echo "  - Access-Control-Allow-Credentials: true (added)"
echo ""
echo "⚠️  IMPORTANT: Your frontend MUST use 'credentials: include' in fetch calls"
echo ""