import { useEffect } from "react";
import { useNavigate } from "react-router";
import { trpc } from "../client/trpc";

export const RequireAdmin = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();

  const { data: userSession, isLoading, isFetching } = trpc.getAdminSession.useQuery(undefined, {
    refetchOnMount: "always",
  });

  useEffect(() => {
    if (isLoading || isFetching) return;
    if (!userSession) {
      navigate("/signin", { replace: true });
    }
  }, [userSession, isLoading, isFetching, navigate]);

  if (isLoading || isFetching) {
    return <div>Loading session...</div>;
  }

  if (!userSession) {
    return null;
  }

  return <>{children}</>;
};
