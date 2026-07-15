import { ONE_YEAR_MS } from "@shared/const";
import { SignJWT, jwtVerify } from "jose";
import { ENV } from "./env";

function getSecretKey() {
  if (!ENV.cookieSecret) {
    throw new Error(
      "JWT_SECRET não configurado. Defina essa variável de ambiente antes de fazer login."
    );
  }
  return new TextEncoder().encode(ENV.cookieSecret);
}

/** Sign a session token identifying a profile (by id). */
export async function signSession(
  profileId: string,
  expiresInMs: number = ONE_YEAR_MS
): Promise<string> {
  const expirationSeconds = Math.floor((Date.now() + expiresInMs) / 1000);

  return new SignJWT({ sub: profileId })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .sign(getSecretKey());
}

/** Verify a session token, returning the profile id it identifies (or null). */
export async function verifySession(
  token: string | undefined | null
): Promise<{ profileId: string } | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });

    if (typeof payload.sub !== "string" || payload.sub.length === 0) {
      return null;
    }

    return { profileId: payload.sub };
  } catch {
    return null;
  }
}
