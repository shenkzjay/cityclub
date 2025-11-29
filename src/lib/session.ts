//use session token
import * as argon2 from "argon2";
import * as jose from "jose";
import type { IncomingMessage, ServerResponse } from "http";
import { parse, serialize } from "cookie";
import { z } from "zod";

const secret = new TextEncoder().encode("city_club_league");

const alg = "HS256";

export interface SessionPayload {
  userId: string;
  expiresAt: string;
}

const SessionPayloadSchema = z.object({
  userId: z.string(),
  expiresAt: z.string().datetime(),
});

//hash the user's password and store in database usng argon2
export const hashPassword = async (password: string): Promise<string> => {
  return await argon2.hash(password);
};

//compare hashed password with plain password text sent to the server
export const compareHashedPassword = async (
  plaintextpassword: string,
  hashPassword: string
): Promise<boolean> => {
  return argon2.verify(hashPassword, plaintextpassword);
};
// ??? should i hash the password on the client too???
//create a sign in jwttoken using jwt and store in cookies https only
export const createEncryptedSession = async (payload: SessionPayload) => {
  const signJwt = await new jose.SignJWT({ username: payload.userId })
    .setProtectedHeader({ alg })
    .setExpirationTime("1d")
    .setIssuedAt()
    .setSubject(payload.userId)
    .sign(secret);

  return signJwt;
};

//verify session token
export const verifySessionToken = async (token: string) => {
  const { payload } = await jose.jwtVerify(token, secret, {
    algorithms: ["HS256"],
  });
  const result = SessionPayloadSchema.safeParse(payload);

  if (!result.success) {
    throw new Error(`Invalid session token: ${result.error.message}`);
  }

  const session = result.data;

  if (new Date(session.expiresAt) <= new Date()) {
    throw new Error("Session expired");
  }

  return session;
};

export const getSessionCookie = async (req: IncomingMessage) => {
  const cookieHeader = req.headers.cookie;
  console.log("getSessionCookie: cookieHeader", cookieHeader);
  if (!cookieHeader) return;

  const cookies = parse(cookieHeader);
  console.log("getSessionCookie: parsed cookies", cookies);

  const sessionToken = cookies.session;
  console.log("getSessionCookie: sessionToken", sessionToken);
  if (!sessionToken) return null;

  try {
    const session = await verifySessionToken(sessionToken);
    console.log("getSessionCookie: verified session", session);

    if (new Date(session.expiresAt) <= new Date()) {
      // Session has expired
      console.log("getSessionCookie: session expired");
      return null;
    }
    console.log("getSessionCookie: returning active session", session);
    return session;
  } catch (error) {
    console.error("getSessionCookie: error verifying session", error);
    return null;
  }
};

//on sign in read the cookies stored in the https only
export const setCookieSession = async (user: SessionPayload, res: ServerResponse) => {
  const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const session: SessionPayload = {
    userId: user.userId,
    expiresAt: expiresInOneDay.toISOString(),
  };

  const encryptedSession = await createEncryptedSession(session);

  const cookieString = serialize("session", encryptedSession, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: Number(expiresInOneDay),
    path: "/",
  });

  res.setHeader("Set-Cookie", cookieString);
};

export const clearCookieSesson = async (res: ServerResponse) => {
  const cookieString = serialize("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  res.setHeader("Set-Cookie", cookieString);
};
