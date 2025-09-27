import React from "react";
import { trpc } from "../src/client/trpc";
import { queryClient, trpcClient } from "../src/client";
import { QueryClientProvider } from "@tanstack/react-query";

export const TRPCProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
};
