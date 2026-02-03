/**
 * Server-side Privy utilities for token verification
 */

import { PrivyClient, verifyAuthToken } from '@privy-io/node';

if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID) {
  throw new Error('Missing NEXT_PUBLIC_PRIVY_APP_ID environment variable');
}

if (!process.env.PRIVY_APP_SECRET) {
  throw new Error('Missing PRIVY_APP_SECRET environment variable');
}

// Initialize Privy client for server-side operations
export const privyServer = new PrivyClient({
  appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID,
  appSecret: process.env.PRIVY_APP_SECRET,
});

/**
 * Verify Privy access token and return user information
 * @param accessToken - The Privy access token from the client
 * @returns Verified user claims
 */
export async function verifyPrivyToken(accessToken: string) {
  try {
    // 使用独立的 verifyAuthToken 函数
    const verifiedClaims = await verifyAuthToken(accessToken, {
      appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
      appSecret: process.env.PRIVY_APP_SECRET!,
    });

    return {
      success: true,
      claims: verifiedClaims,
    };
  } catch (error) {
    console.error('Failed to verify Privy token:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid token',
    };
  }
}

/**
 * Get user information from Privy
 * @param userId - The Privy user ID
 * @returns User data from Privy
 */
export async function getPrivyUser(userId: string) {
  try {
    // 使用 users 服务获取用户信息
    const user = await privyServer.users.get(userId);
    return {
      success: true,
      user,
    };
  } catch (error) {
    console.error('Failed to get Privy user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'User not found',
    };
  }
}
