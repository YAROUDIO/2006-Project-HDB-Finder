// scripts/onemap_token.ts
import 'dotenv/config';

type TokenResponse = {
  access_token: string;
  // They don't always send expiry here; we'll just return the token
};

export async function getOneMapToken(): Promise<string> {
  const email = process.env.ONEMAP_EMAIL || '';
  const password = process.env.ONEMAP_PASSWORD || '';
  if (!email || !password) {
    throw new Error('Missing ONEMAP_EMAIL and/or ONEMAP_PASSWORD in environment.');
  }

  const url = 'https://www.onemap.gov.sg/api/auth/post/getToken';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`getToken HTTP ${res.status} ${res.statusText}: ${txt?.slice(0, 300)}`);
  }

  // OneMap returns JSON with { access_token: "..." }
  const json = (await res.json()) as TokenResponse;
  if (!json?.access_token) {
    throw new Error('getToken success but no access_token in response.');
  }

  return json.access_token;
}
