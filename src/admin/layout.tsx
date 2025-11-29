import { TRPCProvider } from "../provider";
import { Link, useNavigate } from "react-router";
import { trpc } from "../client/trpc";
import { useEffect } from "react";

export const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  // const navigate = useNavigate();
  // const { data: userSession, isLoading } = trpc.getAdminSession.useQuery();

  // console.log({ userSession });

  // useEffect(() => {
  //   if (!isLoading && !userSession) {
  //     navigate("/signin");
  //   }
  // }, [userSession, isLoading, navigate]);

  // if (isLoading) {
  //   return <div>Loading session...</div>;
  // }

  // if (!userSession) {
  //   return null; // Or a loading spinner, or redirect immediately
  // }

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
        <div className="w-full bg-[#262626]">{children}</div>
      </section>
    </TRPCProvider>
  );
};
