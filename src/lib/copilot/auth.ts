import { jwtVerify } from 'jose';
import { getAccessToken } from '@/lib/auth/getLoginStatus';
import { getVerificationKey } from '@/lib/auth/verificationKey';

/**
 * Verify the caller's Gen3 session from the request cookie. Other proxies hand the token to a Gen3 service that validates it; an
 * unauthenticated request here reaches an agent that spends real inference budget.
 *
 * Returns the token so the caller can forward it upstream, or null to 401.
 */
export const authenticateCopilotRequest = async (
  cookie: string | undefined,
): Promise<string | null> => {
  const token = getAccessToken(cookie);
  if (!token) return null;

  const key = await getVerificationKey();
  if (!key) return null;

  try {
    await jwtVerify(token, key); // rejects an expired token too
  } catch (error) {
    console.error(
      '[copilotkit] Access token verification failed:',
      error instanceof Error ? error.message : error,
    );
    return null;
  }

  return token;
};
