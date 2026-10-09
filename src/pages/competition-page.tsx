import { useMemo } from "react";
import { Link, useParams } from "react-router";
import { trpc } from "../client/trpc";

export default function CompetitionPage() {
  const { competitionId } = useParams<{ competitionId: string }>();
  const id = Number(competitionId);

  const { data: competition, isLoading, isError } = trpc.getCompetition.useQuery(
    { competitionId: id },
    { enabled: Number.isFinite(id) && id > 0 }
  );

  const sortedTeams = useMemo(() => {
    return [...(competition?.teams ?? [])].sort(
      (a, b) => (b.score?.points ?? 0) - (a.score?.points ?? 0)
    );
  }, [competition?.teams]);

  const sortedPlayers = useMemo(() => {
    const players = (competition?.teams ?? []).flatMap((team) => team.players);
    return [...players].sort((a, b) => {
      if (b.goals !== a.goals) return b.goals - a.goals;
      if (b.assists !== a.assists) return b.assists - a.assists;
      if (b.yellowCard !== a.yellowCard) return b.yellowCard - a.yellowCard;
      return b.redCard - a.redCard;
    });
  }, [competition?.teams]);

  const teamNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const team of competition?.teams ?? []) {
      map.set(team.id, team.teamName);
    }
    return map;
  }, [competition?.teams]);

  if (isLoading) {
    return <div className="p-6">Loading competition...</div>;
  }

  if (isError || !competition) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Competition Not Found</h1>
        <Link to="/history" className="text-[brown] underline">
          ← Back to history
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 text-black">
      <div className="flex flex-row items-center gap-4 mb-6 text-[brown]">
        <Link to="/history">← Back</Link>
        <h1 className="text-3xl font-bold">{competition.name}</h1>
        <span
          className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${
            competition.status === "active"
              ? "bg-green-200 text-green-800"
              : "bg-gray-300 text-gray-700"
          }`}
        >
          {competition.status}
        </span>
      </div>

      {/* Standings */}
      <h2 className="text-xl font-bold mb-4">Final Table</h2>
      <div className="overflow-x-auto">
        <table className="w-full mb-10">
          <thead className="text-sm font-bold">
            <tr>
              <td className="px-3 py-2">Pos</td>
              <td className="px-3 py-2">Team</td>
              <td className="px-3 py-2">P</td>
              <td className="px-3 py-2">W</td>
              <td className="px-3 py-2">L</td>
              <td className="px-3 py-2">D</td>
              <td className="px-3 py-2">GF+</td>
              <td className="px-3 py-2">GA-</td>
              <td className="px-3 py-2">GD+/-</td>
              <td className="px-3 py-2">PTS</td>
            </tr>
          </thead>
          <tbody>
            {sortedTeams.length > 0 ? (
              sortedTeams.map((team, idx) => (
                <tr key={team.id} className="odd:bg-[#f8f0ed] text-[brown] font-bold">
                  <td className="px-3 py-4">{idx + 1}</td>
                  <td className="px-3 py-4 text-nowrap">{team.teamName}</td>
                  <td className="px-3 py-4">{team.score?.gamesPlayed ?? 0}</td>
                  <td className="px-3 py-4">{team.score?.gamesWon ?? 0}</td>
                  <td className="px-3 py-4">{team.score?.gamesLost ?? 0}</td>
                  <td className="px-3 py-4">{team.score?.gamesDrawn ?? 0}</td>
                  <td className="px-3 py-4">{team.score?.goalsFor ?? 0}</td>
                  <td className="px-3 py-4">{team.score?.goalsAgainst ?? 0}</td>
                  <td className="px-3 py-4">{team.score?.goalDifference ?? 0}</td>
                  <td className="px-3 py-4">{team.score?.points ?? 0}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td>No teams recorded for this competition.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Player stats */}
      <h2 className="text-xl font-bold mb-4">Player Stats</h2>
      <div className="overflow-x-auto mb-10">
        <table className="w-full">
          <thead className="text-sm font-bold">
            <tr>
              <td className="px-4 py-2">No</td>
              <td className="px-4 py-2">Name</td>
              <td className="px-4 py-2">⚽️</td>
              <td className="px-4 py-2">👟</td>
              <td className="px-4 py-2">🟨</td>
              <td className="px-4 py-2">🟥</td>
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.length > 0 ? (
              sortedPlayers.map((player, idx) => (
                <tr key={player.id} className="odd:bg-[#f8f0ed] text-[brown] font-bold">
                  <td className="p-4">{idx + 1}</td>
                  <td className="p-4">{player.playerName}</td>
                  <td className="p-4">{player.goals}</td>
                  <td className="p-4">{player.assists}</td>
                  <td className="p-4">{player.yellowCard}</td>
                  <td className="p-4">{player.redCard}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td>No player stats recorded.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Results */}
      <h2 className="text-xl font-bold mb-4">Results</h2>
      <ul className="grid gap-2">
        {competition.matches.length > 0 ? (
          competition.matches.map((match) => (
            <li
              key={match.id}
              className="bg-[#f8f0ed] text-[brown] font-bold rounded-lg px-4 py-3 flex flex-row items-center justify-between gap-4 text-sm"
            >
              <span className="text-nowrap">
                {teamNameById.get(match.homeTeamId ?? -1) ?? "Unknown"}
              </span>
              <span className="text-lg">
                {match.homeGoals} - {match.awayGoals}
              </span>
              <span className="text-nowrap">
                {teamNameById.get(match.awayTeamId ?? -1) ?? "Unknown"}
              </span>
              <span className="text-xs text-gray-500 ml-auto">{match.matchDate}</span>
            </li>
          ))
        ) : (
          <li className="text-sm text-gray-500">No matches recorded.</li>
        )}
      </ul>
    </div>
  );
}
