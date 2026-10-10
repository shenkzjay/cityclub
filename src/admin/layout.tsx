import { TRPCProvider } from "../provider";
import { Link, useNavigate } from "react-router";
import { trpc } from "../client/trpc";
import { useEffect, useState } from "react";

const NAV_LINKS = [
  { to: "/admin", label: "Home" },
  { to: "/admin/teams/create-teams", label: "Teams" },
  { to: "/admin/players/create-players", label: "Players" },
  { to: "/admin/points/points-update", label: "Scores" },
  { to: "/admin/fixtures", label: "Fixtures" },
  { to: "/admin/predictions", label: "Predictions" },
  { to: "/admin/totw", label: "Team of the Week" },
  { to: "/admin/news", label: "News" },
  { to: "/admin/competitions", label: "Competitions" },
];

export const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const { data: userSession, isLoading, isFetching } = trpc.getAdminSession.useQuery(undefined, {
    refetchOnMount: "always",
  });
  const logout = trpc.userLogout.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (isLoading || isFetching) return;
    if (!userSession) {
      navigate("/signin");
    }
  }, [userSession, isLoading, isFetching, navigate]);

  const handleSignOut = async () => {
    try {
      await logout.mutateAsync();
    } catch {
      // Session cookie is cleared server-side; proceed regardless.
    }
    utils.getAdminSession.invalidate();
    navigate("/signin");
  };

  if (isLoading || isFetching) {
    return <div>Loading session...</div>;
  }

  if (!userSession) {
    return null;
  }

  return (
    <TRPCProvider>
      <div className="min-h-screen lg:flex">
        {isOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}

        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-label="Toggle menu"
          className="fixed top-4 left-4 z-50 rounded-lg bg-[#333] p-2 text-white lg:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {isOpen ? (
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            )}
          </svg>
        </button>

        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-[18rem] flex-col bg-[#333] transition-transform duration-200 lg:static lg:h-screen lg:translate-x-0 ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <ul className="grid gap-4 py-6 px-2">
            {NAV_LINKS.map((link) => (
              <li key={link.to} className="hover:bg-[#262626] cursor-pointer flex">
                <Link to={link.to} className="w-full p-3" onClick={() => setIsOpen(false)}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-auto border-t border-white/10 p-3">
            <p className="mb-2 px-1 text-xs text-white/50">{userSession.username}</p>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={logout.isPending}
              className="w-full rounded-lg bg-white/10 p-3 text-left text-white hover:bg-white/20 disabled:opacity-50"
            >
              Sign out
            </button>
          </div>
        </aside>

        <div className="w-full min-w-0 bg-[#262626] pt-16 lg:pt-0">{children}</div>
      </div>
    </TRPCProvider>
  );
};