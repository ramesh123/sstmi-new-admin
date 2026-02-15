#!/bin/bash
# AWS CLI Script to Create API Gateway for Cognito Admin Manager
# Lambda ARN: arn:aws:lambda:us-east-1:626635407704:function:cognito-admin-manager

set -e  # Exit on error

REGION="us-east-1"
LAMBDA_ARN="arn:aws:lambda:us-east-1:626635407704:function:cognito-admin-manager"
LAMBDA_NAME="cognito-admin-manager"
ACCOUNT_ID="626635407704"
API_NAME="cognito-admin-api"

echo "🚀 Creating API Gateway for Cognito Admin Manager..."

# Step 1: Create REST API
echo "📝 Step 1: Creating REST API..."
API_ID=$(aws apigateway create-rest-api \
    --name "$API_NAME" \
    --description "API for managing Cognito users" \
    --region $REGION \
    --endpoint-configuration types=REGIONAL \
    --query 'id' \
    --output text)

echo "✅ API Created: $API_ID"

# Get the root resource ID
ROOT_ID=$(aws apigateway get-resources \
    --rest-api-id $API_ID \
    --region $REGION \
    --query 'items[0].id' \
    --output text)

echo "✅ Root Resource ID: $ROOT_ID"

# Step 2: Create /admin resource
echo "📝 Step 2: Creating /admin resource..."
ADMIN_RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $ROOT_ID \
    --path-part admin \
    --region $REGION \
    --query 'id' \
    --output text)

echo "✅ /admin resource created: $ADMIN_RESOURCE_ID"

# Step 3: Create /admin/list-users resource
echo "📝 Step 3: Creating /admin/list-users resource..."
LIST_USERS_RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $ADMIN_RESOURCE_ID \
    --path-part list-users \
    --region $REGION \
    --query 'id' \
    --output text)

echo "✅ /admin/list-users resource created: $LIST_USERS_RESOURCE_ID"

# Step 4: Create GET method on /admin/list-users
echo "📝 Step 4: Creating GET method on /admin/list-users..."
aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $LIST_USERS_RESOURCE_ID \
    --http-method GET \
    --authorization-type NONE \
    --region $REGION

# Step 5: Integrate GET method with Lambda
echo "📝 Step 5: Integrating GET method with Lambda..."
aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $LIST_USERS_RESOURCE_ID \
    --http-method GET \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations" \
    --region $REGION

# Step 6: Grant API Gateway permission to invoke Lambda for GET
echo "📝 Step 6: Granting Lambda invoke permission for GET..."
aws lambda add-permission \
    --function-name $LAMBDA_NAME \
    --statement-id apigateway-get-list-users \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/GET/admin/list-users" \
    --region $REGION || echo "Permission already exists"

# Step 7: Create /admin/create-user resource
echo "📝 Step 7: Creating /admin/create-user resource..."
CREATE_USER_RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $ADMIN_RESOURCE_ID \
    --path-part create-user \
    --region $REGION \
    --query 'id' \
    --output text)

# Step 8: Create POST method on /admin/create-user
echo "📝 Step 8: Creating POST method on /admin/create-user..."
aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $CREATE_USER_RESOURCE_ID \
    --http-method POST \
    --authorization-type NONE \
    --region $REGION

# Step 9: Integrate POST method with Lambda
aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $CREATE_USER_RESOURCE_ID \
    --http-method POST \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations" \
    --region $REGION

# Step 10: Grant Lambda permission for POST create-user
aws lambda add-permission \
    --function-name $LAMBDA_NAME \
    --statement-id apigateway-post-create-user \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/POST/admin/create-user" \
    --region $REGION || echo "Permission already exists"

# Step 11: Create /admin/update-user resource
echo "📝 Step 11: Creating /admin/update-user resource..."
UPDATE_USER_RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $ADMIN_RESOURCE_ID \
    --path-part update-user \
    --region $REGION \
    --query 'id' \
    --output text)

aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $UPDATE_USER_RESOURCE_ID \
    --http-method POST \
    --authorization-type NONE \
    --region $REGION

aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $UPDATE_USER_RESOURCE_ID \
    --http-method POST \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations" \
    --region $REGION

aws lambda add-permission \
    --function-name $LAMBDA_NAME \
    --statement-id apigateway-post-update-user \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/POST/admin/update-user" \
    --region $REGION || echo "Permission already exists"

# Step 12: Create /admin/toggle-user-status resource
echo "📝 Step 12: Creating /admin/toggle-user-status resource..."
TOGGLE_RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $ADMIN_RESOURCE_ID \
    --path-part toggle-user-status \
    --region $REGION \
    --query 'id' \
    --output text)

aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $TOGGLE_RESOURCE_ID \
    --http-method POST \
    --authorization-type NONE \
    --region $REGION

aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $TOGGLE_RESOURCE_ID \
    --http-method POST \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations" \
    --region $REGION

aws lambda add-permission \
    --function-name $LAMBDA_NAME \
    --statement-id apigateway-post-toggle-status \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/POST/admin/toggle-user-status" \
    --region $REGION || echo "Permission already exists"

# Step 13: Create /admin/reset-password resource
echo "📝 Step 13: Creating /admin/reset-password resource..."
RESET_RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $ADMIN_RESOURCE_ID \
    --path-part reset-password \
    --region $REGION \
    --query 'id' \
    --output text)

aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $RESET_RESOURCE_ID \
    --http-method POST \
    --authorization-type NONE \
    --region $REGION

aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $RESET_RESOURCE_ID \
    --http-method POST \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations" \
    --region $REGION

aws lambda add-permission \
    --function-name $LAMBDA_NAME \
    --statement-id apigateway-post-reset-password \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/POST/admin/reset-password" \
    --region $REGION || echo "Permission already exists"

# Step 14: Create /admin/delete-user resource
echo "📝 Step 14: Creating /admin/delete-user resource..."
DELETE_RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $ADMIN_RESOURCE_ID \
    --path-part delete-user \
    --region $REGION \
    --query 'id' \
    --output text)

aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $DELETE_RESOURCE_ID \
    --http-method POST \
    --authorization-type NONE \
    --region $REGION

aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $DELETE_RESOURCE_ID \
    --http-method POST \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations" \
    --region $REGION

aws lambda add-permission \
    --function-name $LAMBDA_NAME \
    --statement-id apigateway-post-delete-user \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/POST/admin/delete-user" \
    --region $REGION || echo "Permission already exists"

# Step 15: Enable CORS for all resources
echo "📝 Step 15: Enabling CORS for all resources..."

# Function to enable CORS on a resource
enable_cors() {
    local RESOURCE_ID=$1
    local RESOURCE_PATH=$2
    
    echo "  Enabling CORS on $RESOURCE_PATH..."
    
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
        --response-parameters '{"method.response.header.Access-Control-Allow-Headers":false,"method.response.header.Access-Control-Allow-Methods":false,"method.response.header.Access-Control-Allow-Origin":false}' \
        --region $REGION
    
    # Integration response for OPTIONS
    aws apigateway put-integration-response \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --http-method OPTIONS \
        --status-code 200 \
        --response-parameters '{"method.response.header.Access-Control-Allow-Headers":"'\''Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'\''","method.response.header.Access-Control-Allow-Methods":"'\''GET,POST,OPTIONS'\''","method.response.header.Access-Control-Allow-Origin":"'\''*'\''"}' \
        --region $REGION
}

# Enable CORS on all resources
enable_cors $LIST_USERS_RESOURCE_ID "/admin/list-users"
enable_cors $CREATE_USER_RESOURCE_ID "/admin/create-user"
enable_cors $UPDATE_USER_RESOURCE_ID "/admin/update-user"
enable_cors $TOGGLE_RESOURCE_ID "/admin/toggle-user-status"
enable_cors $RESET_RESOURCE_ID "/admin/reset-password"
enable_cors $DELETE_RESOURCE_ID "/admin/delete-user"

# Step 16: Deploy API
echo "📝 Step 16: Deploying API to 'prod' stage..."
aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name prod \
    --stage-description "Production stage" \
    --description "Initial deployment" \
    --region $REGION

# Step 17: Get the invoke URL
INVOKE_URL="https://$API_ID.execute-api.$REGION.amazonaws.com/prod"

echo ""
echo "✅ =========================================="
echo "✅ API Gateway Created Successfully!"
echo "✅ =========================================="
echo ""
echo "📋 API Details:"
echo "   API ID: $API_ID"
echo "   Region: $REGION"
echo "   Stage: prod"
echo ""
echo "🌐 Invoke URL:"
echo "   $INVOKE_URL"
echo ""
echo "📍 Endpoints:"
echo "   GET  $INVOKE_URL/admin/list-users"
echo "   POST $INVOKE_URL/admin/create-user"
echo "   POST $INVOKE_URL/admin/update-user"
echo "   POST $INVOKE_URL/admin/toggle-user-status"
echo "   POST $INVOKE_URL/admin/reset-password"
echo "   POST $INVOKE_URL/admin/delete-user"
echo ""
echo "🔧 Next Steps:"
echo "   1. Update your frontend with this URL:"
echo "      Replace 'YOUR_LAMBDA_ENDPOINT' with: $INVOKE_URL"
echo ""
echo "   2. Test the API:"
echo "      curl $INVOKE_URL/admin/list-users"
echo ""
echo "✅ Done!"