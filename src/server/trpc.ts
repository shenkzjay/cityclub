import { initTRPC } from "@trpc/server";
import { db } from "../db/db";

const t = initTRPC.create();

export const createContext = async () => {
  return {
    db: db.get(),
  };
};

export const router = t.router;
export const publicProcedure = t.procedure;
