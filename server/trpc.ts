import { initTRPC } from "@trpc/server";

const t = initTRPC.create();

export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * This is how you'd find a user in a database
 * based on their session cookie or token
 */
const getUser = () => {
  // ...
  return { name: "alex" };
};

/**
 * This is your actual context that will be passed to the router
 * and all of your procedures.
 *
 * @link https://trpc.io/docs/context
 */
export const createContext = () => {
  return {
    user: getUser(),
  };
};
