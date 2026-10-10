import { useMemo, useState } from "react";
import { AdminLayout } from "../layout";
import { trpc } from "../../client/trpc";
import { formatKickoff, type FixtureDto } from "../../lib/fixtures";

function fixtureLabel(fixture: FixtureDto): string {
  const home = fixture.homeTeam?.teamName ?? "Team ?";
  const away = fixture.awayTeam?.teamName ?? "Team ?";
  const week = fixture.round != null ? ` (W${fixture.round})` : "";
  const status = fixture.status === "final" ? ` · ${fixture.homeGoals}-${fixture.awayGoals}` : "";
  return `${home} vs ${away}${week}${status}`;
}

export default function PointsUpdate() {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFixtureId, setSelectedFixtureId] = useState<number | "">("");
  const [homeTeamScore, setHomeTeamScore] = useState(0);
  const [awayTeamScore, setAwayTeamScore] = useState(0);

  const recordMatch = trpc.recordMatchScores.useMutation();
  const utils = trpc.useUtils();

  const {
    data: fixtures = [],
    isError: fixturesError,
    isLoading: fixturesLoading,
  } = trpc.getFixtures.useQuery();
  const { data: teams = [] } = trpc.getTeams.useQuery();

  const selectedFixture = useMemo(
    () => fixtures.find((fixture) => fixture.id === selectedFixtureId),
    [fixtures, selectedFixtureId]
  );

  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => {
      return (b.score?.points ?? 0) - (a.score?.points ?? 0);
    });
  }, [teams]);

  const handleCancel = () => {
    setIsEditing(false);
    setHomeTeamScore(0);
    setAwayTeamScore(0);
  };

  const handleSubmit = async () => {
    if (!selectedFixtureId) {
      alert("Please select a fixture.");
      return;
    }

    try {
      await recordMatch.mutateAsync({
        matchId: Number(selectedFixtureId),
        homeGoals: homeTeamScore,
        awayGoals: awayTeamScore,
      });

      utils.getTeams.invalidate();
      utils.getFixtures.invalidate();
      utils.matchPredictionsList.invalidate({ matchId: Number(selectedFixtureId) });

      alert("Match result recorded successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to record match:", error);
      alert(
        error instanceof Error ? error.message : "Failed to record match. Please try again."
      );
    }
  };

  if (fixturesLoading) {
    return (
      <AdminLayout>
        <div className="p-6 text-white">Loading fixtures...</div>
      </AdminLayout>
    );
  }

  if (fixturesError) {
    return (
      <AdminLayout>
        <div className="p-6 text-red-500">Failed to load fixtures.</div>
      </AdminLayout>
    );
  }

  const homeTeamName = selectedFixture?.homeTeam?.teamName ?? "Home team";
  const awayTeamName = selectedFixture?.awayTeam?.teamName ?? "Away team";

  return (
    <AdminLayout>
      <section className="p-4 sm:p-6 text-white">
        <div>
          <h3 className="text-2xl font-bold mb-2">Record Match Result</h3>
          <p className="text-sm text-slate-400 mb-6">
            Choose a scheduled fixture and enter its final score. Settles the Predict &amp; Win
            entries automatically.
          </p>

          <div className="max-w-xl">
            <label htmlFor="fixtureSelect" className="block text-sm mb-2">
              Fixture
            </label>
            <select
              id="fixtureSelect"
              value={selectedFixtureId}
              onChange={(e) => {
                const value = e.target.value ? Number(e.target.value) : "";
                setSelectedFixtureId(value);
                const fixture = fixtures.find((item) => item.id === value);
                setHomeTeamScore(fixture?.homeGoals ?? 0);
                setAwayTeamScore(fixture?.awayGoals ?? 0);
              }}
              className="border py-2 px-4 rounded-xl w-full bg-[#333] text-white [color-scheme:dark]"
            >
              <option value="">Select fixture</option>
              {fixtures.map((fixture) => (
                <option key={fixture.id} value={fixture.id}>
                  {fixtureLabel(fixture)}
                </option>
              ))}
            </select>

            {selectedFixture ? (
              <p className="text-xs text-slate-500 mt-2">{formatKickoff(selectedFixture)}</p>
            ) : (
              <p className="text-xs text-slate-500 mt-2">Select a fixture to record its result.</p>
            )}
          </div>

          {selectedFixture && (
            <div className="mt-6">
              <div className="flex flex-col sm:flex-row w-full lg:w-1/2 gap-4">
                {/* Home Team */}
                <div className="bg-[#333] w-full p-4 flex flex-col items-center gap-6 rounded-2xl">
                  <div className="flex flex-col gap-6 items-center">
                    <h3 className="text-slate-400">Home Team</h3>
                    <p className="text-2xl">{homeTeamName}</p>
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        className="px-4 py-2 rounded-xl border w-24 text-center text-black"
                        value={homeTeamScore}
                        onChange={(e) => setHomeTeamScore(Math.max(0, Number(e.target.value)))}
                      />
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
                    <p className="text-2xl">{awayTeamName}</p>
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        className="px-4 py-2 rounded-xl border w-24 text-center text-black"
                        value={awayTeamScore}
                        onChange={(e) => setAwayTeamScore(Math.max(0, Number(e.target.value)))}
                      />
                    ) : (
                      <p className="text-center w-fit text-6xl bg-[#c4c4c4] font-bold text-black px-4 py-1 rounded-lg">
                        {awayTeamScore}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap gap-4">
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
                    onClick={() => setIsEditing(true)}
                    className="bg-white text-black px-6 py-2 rounded-xl font-bold hover:bg-gray-100"
                  >
                    Enter Scores
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="w-full overflow-x-auto mt-10">
          <table className="w-full whitespace-nowrap">
            <thead>
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
              {sortedTeams.length > 0
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
        </div>
      </section>
    </AdminLayout>
  );
}