import { QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../../server";

export const queryClient = new QueryClient();

const getTrpcUrl = () => {
  if (import.meta.env.DEV) {
    // Your standalone server runs on port 3005 with root endpoint
    return "http://localhost:3005";
  } else {
    // Production uses relative path
    return "/api/trpc";
  }
};

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: getTrpcUrl(),
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: "include",
        });
      },
    }),
  ],
});
