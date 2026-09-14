import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./db";
import type { User, Department } from "@prisma/client";

const COOKIE_NAME = "orms_session";
const SESSION_DURATION_SECONDS = 8 * 60 * 60; // 8 hours

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET is missing or too short. Set a long random value in your .env file."
    );
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  sub: string; // user id
};

/** Sign a session JWT for the given user id and return the token string. */
export async function createSessionToken(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

/** Verify a session JWT. Returns the payload, or null if invalid/expired. */
export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (!payload.sub) return null;
    return { sub: payload.sub };
  } catch {
    return null;
  }
}

/** Set the signed session cookie on the current response. */
export async function setSessionCookie(userId: string) {
  const token = await createSessionToken(userId);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export type SessionUser = User & { department: Department | null };

/**
 * Load the currently authenticated, active user from the database, based on
 * the session cookie. Returns null if there is no valid session, or if the
 * account has since been disabled. Always hits the database (not just the
 * signed cookie) so a disabled account loses access immediately.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: { department: true },
  });

  if (!user || !user.isActive) return null;
  return user;
}

export { COOKIE_NAME as SESSION_COOKIE_NAME };
