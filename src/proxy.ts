import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import {
  buildContentSecurityPolicy,
  generateCspNonce,
} from '@/lib/security/csp';

export default auth((request) => {
  const nonce = generateCspNonce();
  const csp = buildContentSecurityPolicy(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set('Content-Security-Policy', csp);
  return response;
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
};
