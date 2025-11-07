// src/components/TeamPage.tsx
import { useParams, Link } from "react-router";
import { trpc } from "../client/trpc";

export default function TeamPage() {
  const { teamName: encodedTeamName } = useParams<{ teamName: string }>();
  const teamName = decodeURIComponent(encodedTeamName || "");

  const { data: teams = [], isLoading, isError } = trpc.getTeams.useQuery();

  // Find the team by name
  const team = teams.find((t) => t.teamName === teamName.replace(/([a-z])([A-Z])/g, "$1 $2"));

  if (isLoading) {
    return <div className="p-6">Loading team details...</div>;
  }

  if (isError || !team) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Team Not Found</h1>
        <p>Sorry, we couldn't find the team "{teamName}".</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-[#f8f0ed] rounded-xl p-6">
        <div className="flex flex-row gap-6 mb-4 items-center text-[brown]">
          <Link to={"/"}>← Back</Link>
          <h1 className="text-3xl font-bold">{team.teamName || "Untitled"}</h1>
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-[brown]">
          <div className="border-2 border-dashed border-[brown] p-4 rounded-lg text-center">
            <p className="text-sm text-[brown]">Played</p>
            <p className="text-2xl font-bold">{team.score?.gamesPlayed || 0}</p>
          </div>
          <div className="border-2 border-dashed border-[brown] p-4 rounded-lg text-center">
            <p className="text-sm text-[brown]">Wins</p>
            <p className="text-2xl font-bold">{team.score?.gamesWon || 0}</p>
          </div>
          <div className="border-2 border-dashed border-[brown] p-4 rounded-lg text-center">
            <p className="text-sm text-[brown]">Draws</p>
            <p className="text-2xl font-bold">{team.score?.gamesDrawn || 0}</p>
          </div>
          <div className="border-2 border-dashed border-[brown] p-4 rounded-lg text-center">
            <p className="text-sm text-[brown]">Losses</p>
            <p className="text-2xl font-bold">{team.score?.gamesLost || 0}</p>
          </div>
        </div>

        {/* Goal Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6 text-[brown]">
          <div className="border-2 border-dashed border-[brown] p-4 rounded-lg text-center">
            <p className="text-sm ">Goals For</p>
            <p className="text-2xl font-bold">{team.score?.goalsFor || 0}</p>
          </div>
          <div className="border-2 border-dashed border-[brown] p-4 rounded-lg text-center">
            <p className="text-sm text-[brown]">Goals Against</p>
            <p className="text-2xl font-bold">{team.score?.goalsAgainst || 0}</p>
          </div>
          <div className="border-2 border-dashed border-[brown] p-4 rounded-lg text-center">
            <p className="text-sm text-[brown]">Goal Diff</p>
            <p className="text-2xl font-bold">{team.score?.goalDifference || 0}</p>
          </div>
        </div>

        <div className="border-2 border-dashed border-[brown] p-4 rounded-lg text-center">
          <p className="text-sm text-[brown]">Points</p>
          <p className="text-3xl font-bold text-[brown]">{team.score?.points || 0}</p>
        </div>
      </div>

      {/* Upcoming Fixtures */}
      <div className="mt-20">
        <h2 className="text-2xl font-bold mb-4">Team Players</h2>
        <div className="space-y-2">
          <table className="w-full ">
            <thead className="w-full text-sm font-bold text-black">
              <tr>
                <td className="px-4 py-2">No</td>
                <td className="px-4 py-2">Name</td>
                <td className="px-4 py-2">⚽️</td>
                <td className="px-4 py-2">👟</td>
                <td className="px-4 py-2">🟨</td>
                <td className="px-4 py-2">🟥</td>
                <td className="px-4 py-2"></td>
              </tr>
            </thead>
            <tbody>
              {team.players && team.players.length > 0 ? (
                team.players.map((player, idx) => (
                  <tr key={player.id} className="font-bold odd:bg-[#f8f0ed] text-[brown]">
                    <td className="px-4 py-2">{idx + 1}</td>
                    <td className="px-4 py-2">{player.playerName}</td>
                    <td className="px-4 py-2">{player.goals}</td>
                    <td className="px-4 py-2">{player.assists}</td>
                    <td className="px-4 py-2">{player.yellowCard}</td>
                    <td className="px-4 py-2">{player.redCard}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center mt-6">
                    No players listed yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
