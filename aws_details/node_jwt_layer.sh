#!/bin/bash

# Quick Layer Creation Script for AWS CloudShell
# Run this in CloudShell to create a Lambda layer for JWT authentication

echo "=========================================="
echo "Creating Lambda Layer for JWT Auth"
echo "=========================================="

# Clean up any existing directories
rm -rf lambda-layer cognito-auth-layer.zip

# Create directory structure
echo "Creating directory structure..."
mkdir -p lambda-layer/nodejs
cd lambda-layer/nodejs

# Create package.json
echo "Creating package.json..."
cat > package.json << 'EOF'
{
  "name": "cognito-auth-layer",
  "version": "1.0.0",
  "dependencies": {
    "jsonwebtoken": "^9.0.2",
    "jwks-rsa": "^3.1.0"
  }
}
EOF

# Install dependencies
echo "Installing npm packages..."
npm install --production

# Go back to parent directory
cd ..

# Create zip file
echo "Creating zip file..."
zip -r cognito-auth-layer.zip nodejs/

# Show file size
echo ""
echo "Layer package created:"
ls -lh cognito-auth-layer.zip

# Verify structure
echo ""
echo "Verifying package structure:"
unzip -l cognito-auth-layer.zip | head -15

echo ""
echo "=========================================="
echo "Layer package ready!"
echo "=========================================="
echo ""
echo "To upload to AWS Lambda Layers, run:"
echo ""
echo "aws lambda publish-layer-version \\"
echo "  --layer-name cognito-auth-dependencies \\"
echo "  --description 'JWT and JWKS dependencies for Cognito authentication' \\"
echo "  --zip-file fileb://cognito-auth-layer.zip \\"
echo "  --compatible-runtimes nodejs24.x"
echo ""
echo "Then attach to your function with:"
echo ""
echo "aws lambda update-function-configuration \\"
echo "  --function-name YOUR_FUNCTION_NAME \\"
echo "  --layers <LAYER_ARN_FROM_ABOVE>"
echo ""