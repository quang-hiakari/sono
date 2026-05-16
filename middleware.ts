import { type NextRequest, NextResponse } from 'next/server';

export function middleware(_request: NextRequest) {
  // Session validation happens in layout/page via getCurrentUser()
  // Better Auth handles session cookies via its own /api/auth/* routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
