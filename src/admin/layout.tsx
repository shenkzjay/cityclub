import { TRPCProvider } from "../provider";
import { Link } from "react-router";

export const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <TRPCProvider>
      <section className="flex flex-row">
        <div className="w-[18rem] h-screen bg-[#333] ">
          <ul className="py-6  grid gap-4">
            <li className=" hover:bg-[#262626] cursor-pointer flex">
              <Link to="/admin" className=" w-full p-3 ">
                Home
              </Link>
            </li>
            <li className=" hover:bg-[#262626] cursor-pointer flex ">
              <Link to={"/admin/teams/create-teams"} className=" w-full p-3 ">
                Teams
              </Link>
            </li>
            <li className="hover:bg-[#262626] cursor-pointer flex">
              <Link to={"/admin/players/create-players"} className=" w-full p-3 ">
                Players
              </Link>
            </li>
            <li className=" hover:bg-[#262626] cursor-pointer flex">
              <Link to={"/admin/points/points-update"} className=" w-full p-3 ">
                Scores
              </Link>
            </li>
          </ul>
        </div>
        <div className="w-full">{children}</div>
      </section>
    </TRPCProvider>
  );
};
