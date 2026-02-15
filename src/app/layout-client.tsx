"use client";

import { useEffect } from 'react';
import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";
import { SignatureV4 } from "@aws-sdk/signature-v4";
import { HttpRequest } from "@aws-sdk/protocol-http";
import { Sha256 } from "@aws-crypto/sha256-js";

// Custom logging function
export const log = (...args: unknown[]): void => {
  if (process.env.NEXT_PUBLIC_CONSOLE_LOG === 'on') {
    console.log(...args);
  }
};

const REGION = "us-east-1";
const IDENTITY_POOL_ID = "us-east-1:48fde939-9161-476d-90e9-cfbade339256";

let credentials: any = null;
let cognitoIdentityId: string | null = null;

export const getCredentials = async () => {
  if (!credentials) {
    log("Initializing AWS credentials");
    const credentialsProvider = fromCognitoIdentityPool({
      client: new CognitoIdentityClient({ region: REGION }),
      identityPoolId: IDENTITY_POOL_ID
    });
    credentials = credentialsProvider;
    
    // Get and store the Cognito Identity ID
    const credentialsObject = await credentialsProvider();
    cognitoIdentityId = (credentialsObject as any).identityId;
    log("Cognito Identity ID:", cognitoIdentityId);
  }
  return credentials();
};

export const getCognitoIdentityId = () => cognitoIdentityId;

export async function makeSignedRequest(endpoint: string, method: string, body: any) {
  log("Making signed request to:", endpoint);

  const creds = await getCredentials();

  // Include cognitoIdentityId in the body if it's available
  if (cognitoIdentityId && body) {
    body.cognitoIdentityId = cognitoIdentityId;
  }

  const request = new HttpRequest({
    method,
    hostname: new URL(endpoint).hostname,
    path: new URL(endpoint).pathname + new URL(endpoint).search,
    headers: {
      'Content-Type': 'application/json',
      'Host': new URL(endpoint).hostname,
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const signer = new SignatureV4({
    credentials: creds,
    region: REGION,
    service: 'execute-api',
    sha256: Sha256
  });

  const signedRequest = await signer.sign(request);

  log("Request details:", {
    method: signedRequest.method,
    headers: signedRequest.headers,
    body: signedRequest.body
  });

  const response = await fetch(endpoint, {
    method: signedRequest.method,
    headers: signedRequest.headers as HeadersInit,
    body: signedRequest.body
  });

  log("Response status:", response.status);

  if (!response.ok) {
    const errorBody = await response.json();
    const errorMessage = errorBody.message || `${response.status} ${response.statusText}`;
    log("Error response:", errorMessage);
    throw new Error(errorMessage);
  }

  const responseData = await response.json();
  log("Response data:", responseData);

  return responseData;
}


export function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize AWS if needed
    getCredentials().then(() => {
      log("AWS credentials initialized");
    }).catch((error) => {
      log("Error initializing AWS credentials:", error);
    });
  }, []);

  return <>{children}</>;
}