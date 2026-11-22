import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

interface FetchOptions extends RequestInit {
  isServer?: boolean;
}

export async function apiClient<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  const headers = new Headers({
    'Content-Type': 'application/json',
    ...(token && { Cookie: `token=${token}` }),
    ...(options.headers || {}),
  });

  console.log(`[NEXT-API] Making ${options.method} request to: ${BACKEND_URL}${endpoint}`);
  console.log(`[NEXT-API] Headers:`, Object.fromEntries(headers.entries()));
  
  if (options.body) {
    console.log("[NEXT-API] Request body:");
    console.log(options.body);
    console.log("[NEXT-API] Body type:", typeof options.body);
  }

  const res = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers,
    cache: 'no-store'
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.log(`[NEXT-API] Response status: ${res.status}`);
    console.log("[NEXT-API] Incoming data:")
    console.log(err);
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  const data = await res.json();

  console.log(`[NEXT-API] Response status: ${res.status}`);

  console.log("[NEXT-API] Incoming data:")
  console.log(data);
  return data;
}
