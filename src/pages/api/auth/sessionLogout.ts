import type { NextApiRequest, NextApiResponse } from 'next';

import { GEN3_FENCE_SERVICE } from '@gen3/core/server';
import { serialize } from 'cookie';

export default async function (req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let logoutError: unknown;
  try {
    const fenceCookies = [
      req.cookies.fence && `fence=${encodeURIComponent(req.cookies.fence)}`,
      req.cookies.access_token &&
        `access_token=${encodeURIComponent(req.cookies.access_token)}`,
    ].filter((cookie): cookie is string => Boolean(cookie));

    console.log('fence cookies', fenceCookies);
    console.log('logoutUrl', `${GEN3_FENCE_SERVICE}/logout`);
    console.log('full', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(fenceCookies.length > 0 ? { Cookie: fenceCookies.join('; ') } : {}),
      },
    });
    const fenceResponse = await fetch(`${GEN3_FENCE_SERVICE}/logout`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(fenceCookies.length > 0 ? { Cookie: fenceCookies.join('; ') } : {}),
      },
    });

    console.log('fenceResponce', fenceResponse);

    if (!fenceResponse.ok) {
      console.log('enceResponse.status', fenceResponse.status);
      logoutError = new Error(`Fence logout failed (${fenceResponse.status})`);
    }
  } catch (error: unknown) {
    console.log('logout error', error);
    logoutError = error;
  }

  // Clear local authentication even if Fence is temporarily unavailable. This
  // prevents a failed upstream request from leaving the browser authenticated.
  res.setHeader('Set-Cookie', [
    serialize('fence', '', {
      sameSite: 'lax',
      httpOnly: true,
      secure: true,
      path: '/',
      expires: new Date(0),
    }),
    serialize('access_token', '', {
      sameSite: 'lax',
      httpOnly: true,
      secure: true,
      path: '/',
      expires: new Date(0),
    }),
    // delete the credentials_token cookie for credentials login
    serialize('credentials_token', '', {
      sameSite: 'lax',
      httpOnly: process.env.NODE_ENV === 'production',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      expires: new Date(0),
    }),
  ]);

  if (logoutError) {
    res.status(502).json({ error: 'Fence logout failed' });
    return;
  }

  res.status(200).json({ success: 'success' });
}
