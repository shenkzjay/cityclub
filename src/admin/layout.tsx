import { TRPCProvider } from "../provider";
import { Link } from "react-router";

export const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <TRPCProvider>
      <section className="flex flex-row">
        <div className="w-[18rem] h-screen bg-[#333]">
          <ul>
            <li>
              <Link to="/admin">Home</Link>
            </li>
            <li>
              <Link to={"/admin/teams/create-teams"}>Teams</Link>
            </li>
            <li>
              <Link to={"/admin/players/create-players"}>Players</Link>
            </li>
            <li>
              <Link to={"/admin/points/points-update"}>Scores</Link>
            </li>
          </ul>
        </div>
        <div className="w-full">{children}</div>
      </section>
    </TRPCProvider>
  );
};
