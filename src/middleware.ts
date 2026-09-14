import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Middleware runs on the Edge runtime and cannot reach Prisma/the database,
// so it only verifies that a signed, unexpired session cookie is present.
// It is a fast first gate for UX (redirecting anonymous visitors to /login)
// and never the sole authorization check — every page and Server Action
// re-verifies the user (including current role and active status) against
// the database via getCurrentUser()/requireRole(). See src/lib/authorization.ts.

const COOKIE_NAME = "orms_session";
const PUBLIC_PATHS = ["/login"];

async function hasValidSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p);
  const authenticated = await hasValidSession(request);

  if (isPublic) {
    if (authenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (!authenticated) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static, _next/image (Next internals)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
