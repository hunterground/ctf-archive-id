// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  let cspHeader = '';
  function generateNonce(): string {
    // Using Web Crypto API
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Buffer.from(array).toString('base64');
  }

  const nonce = generateNonce();
  
  // For your troubles
  if (pathname.startsWith('/note/')) {
    cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-inline';
      style-src 'self' 'nonce-${nonce}';
      img-src 'self';
      font-src 'self';
      frame-ancestors 'none';
      form-action 'self';
      base-uri 'self';
    `.replace(/\s+/g, ' ').trim();
  }
  
  else if (pathname.startsWith('/announcement/')) {
    cspHeader = `
      default-src 'self';
      script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
      style-src 'self' 'nonce-${nonce}';
      img-src 'self';
      font-src 'self';
      frame-ancestors 'none';
      form-action 'self';
      base-uri 'self';
    `.replace(/\s+/g, ' ').trim();
  }
  
  const response = NextResponse.next();
  
  if (cspHeader) {
    response.headers.set('Content-Security-Policy', cspHeader);
    request.headers.set('x-nonce', nonce);
  }

  console.log('[middleware] hit')
  
  return response;
}

export const config = {
  matcher: [
    '/note/:path*',
    '/announcement/:path*',
  ],
};