import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

// Publiczne ścieżki - nie wymagają autoryzacji
const publicPaths = ['/login', '/api/auth'];

// Ścieżki niedostępne dla JUROR (tylko ADMIN i STAFF)
const staffOnlyRoutes = ['/admin', '/projects', '/jurors', '/results'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Sprawdź czy ścieżka jest publiczna
  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  );

  // Pobierz token sesji
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Jeśli użytkownik jest zalogowany i próbuje wejść na /login
  if (token && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Jeśli ścieżka wymaga autoryzacji i użytkownik nie jest zalogowany
  if (!isPublicPath && !token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Blokuj JUROR od ścieżek dostępnych tylko dla STAFF/ADMIN
  if (token) {
    const userRole = token.role as string;
    if (userRole === 'JUROR') {
      const isStaffOnlyRoute = staffOnlyRoutes.some((route) =>
        pathname.startsWith(route)
      );
      if (isStaffOnlyRoute) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
