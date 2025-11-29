import { initTRPC } from "@trpc/server";
import { db } from "../db/db.js";
import { getSessionCookie, SessionPayload } from "@/lib/session.js";

import type { NodeHTTPCreateContextFnOptions } from "@trpc/server/adapters/node-http";
import type { IncomingMessage, ServerResponse } from "http";
import { eq } from "drizzle-orm";
import { usersTable } from "@/db/schema.js";

export const createContext = async ({
  req,
  res,
}: NodeHTTPCreateContextFnOptions<IncomingMessage, ServerResponse>) => {
  const userSession = await getSessionCookie(req);

  console.log({ userSession });

  const user = userSession?.userId
    ? await db.get().query.usersTable.findFirst({
        where: eq(usersTable.id, Number(userSession.userId)),
      })
    : null;

  console.log({ user });

  return {
    user,
    db: db.get(),
    req,
    res,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
