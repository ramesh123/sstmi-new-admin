# AWS Cognito User Management Lambda - Setup Guide
## For SSTMI-admin-site User Pool

Quick setup guide to create a Lambda function with Function URL for managing Cognito users and groups.

---

## Your AWS Configuration

- **AWS Account ID:** `626635407704`
- **Region:** `us-east-1`
- **User Pool ID:** `us-east-1_Pbmz165wl`
- **User Pool Name:** `SSTMI-admin-site`
- **IAM Role:** `role_lambda` (existing role with admin rights)

**Existing Groups:** PRIEST, SUPER_ADMIN, us-east-1_Pbmz165wl_Google, VOLUNTEER  
**Current Users:** 13 users

---

## Setup Instructions

### Step 1: Create the Lambda Function

Use this AWS CLI command to create everything in one go:

```bash
# Create the Lambda function with Function URL enabled
aws lambda create-function \
  --function-name CognitoUserManagement \
  --runtime nodejs20.x \
  --role arn:aws:iam::626635407704:role/role_lambda \
  --handler index.handler \
  --region us-east-1 \
  --timeout 30 \
  --memory-size 256 \
  --environment Variables="{USER_POOL_ID=us-east-1_Pbmz165wl,AWS_REGION_COGNITO=us-east-1}" \
  --zip-file fileb://function.zip
```

**Note:** First create `function.zip` with the Lambda code (see Step 2).

---

### Step 2: Prepare the Lambda Code

Save the Lambda code as `index.mjs`, then create a zip file:

```bash
# Create directory
mkdir cognito-lambda
cd cognito-lambda

# Save the Lambda code as index.mjs (code provided separately)
# Then zip it:
zip function.zip index.mjs
```

Now run the create-function command from Step 1.

**OR** if you already created the function, update it:

```bash
aws lambda update-function-code \
  --function-name CognitoUserManagement \
  --zip-file fileb://function.zip \
  --region us-east-1
```

---

### Step 3: Create Function URL (for calling from your NPM static site)

```bash
aws lambda create-function-url-config \
  --function-name CognitoUserManagement \
  --auth-type NONE \
  --cors '{
    "AllowOrigins": ["*"],
    "AllowMethods": ["POST", "OPTIONS"],
    "AllowHeaders": ["content-type"],
    "MaxAge": 86400
  }' \
  --region us-east-1
```

This will output a **Function URL** like:
```
https://xxxxxxxxxx.lambda-url.us-east-1.on.aws/
```

**Save this URL** - you'll use it in your NPM static site to call the Lambda function.

---

### Step 4: Get the Function URL (if you need to retrieve it later)

```bash
aws lambda get-function-url-config \
  --function-name CognitoUserManagement \
  --region us-east-1
```

---

## Using the Lambda Function from Your NPM Static Site

Once you have the Function URL, call it from your JavaScript frontend:

```javascript
const LAMBDA_URL = 'https://xxxxxxxxxx.lambda-url.us-east-1.on.aws/';

// Example: List all users
async function listUsers() {
  const response = await fetch(LAMBDA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'listUsers' })
  });
  const data = await response.json();
  console.log(data);
}

// Example: Create a new user
async function createUser(email, tempPassword) {
  const response = await fetch(LAMBDA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'createUser',
      username: email,
      email: email,
      temporaryPassword: tempPassword
    })
  });
  return await response.json();
}

// Example: Set permanent password
async function setPassword(username, newPassword) {
  const response = await fetch(LAMBDA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'setPassword',
      username: username,
      password: newPassword,
      permanent: true
    })
  });
  return await response.json();
}

// Example: Add user to group
async function addToGroup(username, groupName) {
  const response = await fetch(LAMBDA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'addUserToGroup',
      username: username,
      groupName: groupName // PRIEST, SUPER_ADMIN, VOLUNTEER
    })
  });
  return await response.json();
}

// Example: Enable a disabled user
async function enableUser(username) {
  const response = await fetch(LAMBDA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'enableUser',
      username: username
    })
  });
  return await response.json();
}
```

---

## Available Actions

Send POST requests with JSON body containing `action` and required parameters:

### User Management

**List all users:**
```json
{ "action": "listUsers" }
```

**Get user details:**
```json
{ "action": "getUser", "username": "info@sstmi.org" }
```

**Create user:**
```json
{
  "action": "createUser",
  "username": "newuser@sstmi.org",
  "email": "newuser@sstmi.org",
  "temporaryPassword": "TempPass123!@"
}
```

**Set permanent password:**
```json
{
  "action": "setPassword",
  "username": "newuser@sstmi.org",
  "password": "NewPass123!@",
  "permanent": true
}
```

**Update user attributes:**
```json
{
  "action": "updateUser",
  "username": "newuser@sstmi.org",
  "attributes": {
    "name": "Full Name",
    "phone_number": "+12345678900"
  }
}
```

**Enable user:**
```json
{ "action": "enableUser", "username": "katy.medum20@gmail.com" }
```

**Disable user:**
```json
{ "action": "disableUser", "username": "katy.medum20@gmail.com" }
```

**Delete user:**
```json
{ "action": "deleteUser", "username": "olduser@sstmi.org" }
```

### Group Management

**List all groups:**
```json
{ "action": "listGroups" }
```

**Create group:**
```json
{
  "action": "createGroup",
  "groupName": "DEACON",
  "description": "Deacon access group"
}
```

**Add user to group:**
```json
{
  "action": "addUserToGroup",
  "username": "newuser@sstmi.org",
  "groupName": "SUPER_ADMIN"
}
```

**Remove user from group:**
```json
{
  "action": "removeUserFromGroup",
  "username": "newuser@sstmi.org",
  "groupName": "VOLUNTEER"
}
```

**List user's groups:**
```json
{ "action": "listUserGroups", "username": "info@sstmi.org" }
```

**List users in group:**
```json
{ "action": "listGroupUsers", "groupName": "SUPER_ADMIN" }
```

---

## Quick Commands Reference

**View Lambda logs:**
```bash
aws logs tail /aws/lambda/CognitoUserManagement --follow --region us-east-1
```

**Update Lambda code:**
```bash
zip function.zip index.mjs && \
aws lambda update-function-code \
  --function-name CognitoUserManagement \
  --zip-file fileb://function.zip \
  --region us-east-1
```

**Test Lambda directly:**
```bash
aws lambda invoke \
  --function-name CognitoUserManagement \
  --payload '{"action":"listUsers"}' \
  --region us-east-1 \
  response.json && cat response.json
```

**Delete Function URL (if needed):**
```bash
aws lambda delete-function-url-config \
  --function-name CognitoUserManagement \
  --region us-east-1
```

---

## Testing with curl

Once you have the Function URL, test it:

```bash
# List users
curl -X POST https://xxxxxxxxxx.lambda-url.us-east-1.on.aws/ \
  -H "Content-Type: application/json" \
  -d '{"action":"listUsers"}'

# Create user
curl -X POST https://xxxxxxxxxx.lambda-url.us-east-1.on.aws/ \
  -H "Content-Type: application/json" \
  -d '{
    "action":"createUser",
    "username":"test@sstmi.org",
    "email":"test@sstmi.org",
    "temporaryPassword":"TempPass123!@"
  }'

# Add to PRIEST group
curl -X POST https://xxxxxxxxxx.lambda-url.us-east-1.on.aws/ \
  -H "Content-Type: application/json" \
  -d '{
    "action":"addUserToGroup",
    "username":"test@sstmi.org",
    "groupName":"PRIEST"
  }'
```

---

## Security Note

Since your NPM static site is password-protected, the Lambda Function URL with `auth-type NONE` is acceptable. The Function URL will be publicly accessible but only people who know the URL can call it.

For additional security in the future, you could:
- Add a simple API key check in the Lambda code
- Use AWS IAM auth on the Function URL
- Implement rate limiting

---

## Complete Setup in One Go

If you want to create everything with copy-paste commands:

```bash
# 1. Navigate to your directory
cd ~/cognito-lambda

# 2. Create index.mjs with the Lambda code (paste the code)
# Then zip it:
zip function.zip index.mjs

# 3. Create Lambda function
aws lambda create-function \
  --function-name CognitoUserManagement \
  --runtime nodejs20.x \
  --role arn:aws:iam::626635407704:role/role_lambda \
  --handler index.handler \
  --region us-east-1 \
  --timeout 30 \
  --memory-size 256 \
  --environment Variables="{USER_POOL_ID=us-east-1_Pbmz165wl,AWS_REGION_COGNITO=us-east-1}" \
  --zip-file fileb://function.zip

# 4. Create Function URL
aws lambda create-function-url-config \
  --function-name CognitoUserManagement \
  --auth-type NONE \
  --cors '{
    "AllowOrigins": ["*"],
    "AllowMethods": ["POST", "OPTIONS"],
    "AllowHeaders": ["content-type"],
    "MaxAge": 86400
  }' \
  --region us-east-1

# 5. Get the Function URL
aws lambda get-function-url-config \
  --function-name CognitoUserManagement \
  --region us-east-1
```

Save the Function URL from step 5 and use it in your NPM static site!