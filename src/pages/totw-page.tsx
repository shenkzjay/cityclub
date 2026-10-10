import { Link } from "react-router";
import { trpc } from "../client/trpc";
import { TeamOfTheWeekPitch } from "../components/TeamOfTheWeekPitch";

export default function TotwPage() {
  const { data: teamOfTheWeek, isLoading, isError } = trpc.getTeamOfTheWeek.useQuery(undefined, {
    staleTime: 15 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex flex-row items-center gap-4 mb-2 text-[brown]">
        <Link to="/">← Back</Link>
        <h1 className="text-3xl font-bold">Team of the Week</h1>
      </div>

      <p className="text-sm text-gray-500 mb-6">
        The standout five players this week, lined up in a 2-1-2 shape alongside four
        substitutes.
      </p>

      {isLoading && (
        <div className="animate-pulse">
          <div className="h-[30rem] bg-[#f8f0ed] rounded-xl" />
        </div>
      )}

      {isError && <div className="text-red-500">Failed to load Team of the Week.</div>}

      {!isLoading && !isError && (
        <div className="bg-[#f8f0ed] rounded-xl p-5 sm:p-8">
          <div className="text-center mb-6 text-[brown]">
            {teamOfTheWeek?.competitionName && (
              <p className="text-sm font-semibold uppercase tracking-wide">
                {teamOfTheWeek.competitionName}
              </p>
            )}
            <p className="font-bold text-lg">
              {teamOfTheWeek?.weekLabel || "This week's best"}
            </p>
          </div>

          <TeamOfTheWeekPitch teamOfTheWeek={teamOfTheWeek ?? null} />

          <div className="flex flex-wrap justify-center gap-2 mt-6 text-[10px] font-bold uppercase tracking-wide text-[#62381d]">
            <span className="bg-white rounded-full px-3 py-1">2 Defenders</span>
            <span className="bg-white rounded-full px-3 py-1">1 Midfielder</span>
            <span className="bg-white rounded-full px-3 py-1">2 Forwards</span>
            <span className="bg-white rounded-full px-3 py-1">4 Substitutes</span>
          </div>
        </div>
      )}
    </div>
  );
}