import { useState, useMemo } from "react";
import { AdminLayout } from "../layout";
import { trpc } from "../../client/trpc";

export default function PointsUpdate() {
  const [isEditing, setIsEditing] = useState(false);
  const [homeTeamId, setHomeTeamId] = useState<number | "">("");
  const [awayTeamId, setAwayTeamId] = useState<number | "">("");
  const [homeTeamScore, setHomeTeamScore] = useState(0);
  const [awayTeamScore, setAwayTeamScore] = useState(0);
  const [matchDate, setMatchDate] = useState(() => new Date().toISOString().split("T")[0]);

  const recordMatch = trpc.recordMatchScores.useMutation();
  const utils = trpc.useUtils();

  const { data: allTeams = [], isError, isLoading } = trpc.getTeams.useQuery();

  const sortedTeams = useMemo(() => {
    return [...allTeams].sort((a, b) => {
      return (b.score?.points ?? 0) - (a.score?.points ?? 0);
    });
  }, [allTeams]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset to initial empty state
    setHomeTeamId("");
    setAwayTeamId("");
    setHomeTeamScore(0);
    setAwayTeamScore(0);
    setMatchDate(new Date().toISOString().split("T")[0]);
  };

  const handleSubmit = async () => {
    if (!homeTeamId || !awayTeamId) {
      alert("Please select both home and away teams.");
      return;
    }
    if (homeTeamId === awayTeamId) {
      alert("Home and away teams cannot be the same.");
      return;
    }

    try {
      await recordMatch.mutateAsync({
        homeTeamId,
        awayTeamId,
        homeGoals: homeTeamScore,
        awayGoals: awayTeamScore,
        matchDate,
      });

      // Invalidate queries to refresh standings
      utils.getTeams.invalidate();
      // Optionally invalidate matches if you have a matches query

      alert("Match recorded successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to record match:", error);
      alert("Failed to record match. Please try again.");
    }
  };

  const homeTeam = allTeams?.find((team) => team.id === homeTeamId);
  const awayTeam = allTeams?.find((team) => team.id === awayTeamId);

  if (isLoading)
    return (
      <AdminLayout>
        <div className="p-6">Loading teams...</div>
      </AdminLayout>
    );
  if (isError)
    return (
      <AdminLayout>
        <div className="p-6 text-red-500">Failed to load teams.</div>
      </AdminLayout>
    );

  return (
    <AdminLayout>
      <section className="p-6">
        <div>
          <h3 className="text-2xl font-bold mb-6">Record Match Result</h3>
          <div className="flex mt-6">
            <div className="flex flex-row w-1/2 gap-4">
              {/* Home Team */}
              <div className="bg-[#333] w-full p-4 flex flex-col items-center gap-6 rounded-2xl">
                <div className="flex flex-col gap-6 items-center">
                  <h3 className="text-slate-400">Home Team</h3>
                  {isEditing ? (
                    <select
                      value={homeTeamId}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : "";
                        setHomeTeamId(val);
                        // Auto-clear away if same team selected
                        if (val === awayTeamId) setAwayTeamId("");
                      }}
                      className="px-4 py-2 rounded-xl border bg-white text-black"
                    >
                      <option value="">Select team</option>
                      {allTeams?.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.teamName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-2xl">{homeTeam?.teamName || "Not selected"}</p>
                  )}

                  {isEditing ? (
                    <div>
                      <label htmlFor="homeScore" className="sr-only">
                        Home Score
                      </label>
                      <input
                        type="number"
                        id="homeScore"
                        min="0"
                        className="px-4 py-2 rounded-xl border w-24 text-center"
                        value={homeTeamScore}
                        onChange={(e) => setHomeTeamScore(Math.max(0, Number(e.target.value)))}
                      />
                    </div>
                  ) : (
                    <p className="text-center w-fit text-6xl bg-[#c4c4c4] font-bold text-black px-4 py-1 rounded-lg">
                      {homeTeamScore}
                    </p>
                  )}
                </div>
              </div>

              {/* Away Team */}
              <div className="bg-[#333] w-full p-4 flex flex-col items-center gap-6 rounded-2xl">
                <div className="flex flex-col gap-6 items-center">
                  <h3 className="text-slate-400">Away Team</h3>
                  {isEditing ? (
                    <select
                      value={awayTeamId}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : "";
                        setAwayTeamId(val);
                      }}
                      className="px-4 py-2 rounded-xl border bg-white text-black"
                    >
                      <option value="">Select team</option>
                      {allTeams
                        ?.filter((team) => team.id !== homeTeamId)
                        .map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.teamName}
                          </option>
                        ))}
                    </select>
                  ) : (
                    <p className="text-2xl">{awayTeam?.teamName || "Not selected"}</p>
                  )}

                  {isEditing ? (
                    <div>
                      <label htmlFor="awayScore" className="sr-only">
                        Away Score
                      </label>
                      <input
                        type="number"
                        id="awayScore"
                        min="0"
                        className="px-4 py-2 rounded-xl border w-24 text-center"
                        value={awayTeamScore}
                        onChange={(e) => setAwayTeamScore(Math.max(0, Number(e.target.value)))}
                      />
                    </div>
                  ) : (
                    <p className="text-center w-fit text-6xl bg-[#c4c4c4] font-bold text-black px-4 py-1 rounded-lg">
                      {awayTeamScore}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-4">
            {isEditing ? (
              <>
                <button
                  onClick={handleSubmit}
                  disabled={recordMatch.isPending}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-xl font-bold disabled:opacity-50"
                >
                  {recordMatch.isPending ? "Recording..." : "Record Match"}
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-xl font-bold"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={handleEdit}
                className="bg-white text-black px-6 py-2 rounded-xl font-bold hover:bg-gray-100"
              >
                Enter Scores
              </button>
            )}
          </div>
        </div>

        <table className="w-full mt-6">
          <thead>
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
          </thead>

          <tbody>
            {sortedTeams && sortedTeams.length > 0
              ? sortedTeams.map((team, idx) => (
                  <tr key={team.id} className="odd:bg-[#333] even:bg-[#262626]">
                    <td className="px-3 py-2">{idx + 1}</td>
                    <td className="px-3 py-2">{team.teamName}</td>
                    <td className="px-3 py-2">{team.score.gamesPlayed}</td>
                    <td className="px-3 py-2">{team.score.gamesWon}</td>
                    <td className="px-3 py-2">{team.score.gamesLost}</td>
                    <td className="px-3 py-2">{team.score.gamesDrawn}</td>
                    <td className="px-3 py-2">{team.score.goalsFor}</td>
                    <td className="px-3 py-2">{team.score.goalsAgainst}</td>
                    <td className="px-3 py-2">{team.score.goalDifference}</td>
                    <td className="px-3 py-2">{team.score.points}</td>
                  </tr>
                ))
              : ""}
          </tbody>
        </table>
      </section>
    </AdminLayout>
  );
}
