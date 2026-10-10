import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { AdminLayout } from "../layout";
import { trpc } from "../../client/trpc";
import { formatKickoff, type FixtureDto } from "../../lib/fixtures";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../server";

type MatchPredictionsOutput = inferRouterOutputs<AppRouter>["matchPredictionsList"];
type Entry = MatchPredictionsOutput["entries"][number];

function formatSubmitted(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function fixtureLabel(fixture: FixtureDto): string {
  const home = fixture.homeTeam?.teamName ?? "Team ?";
  const away = fixture.awayTeam?.teamName ?? "Team ?";
  const week = fixture.round != null ? ` (W${fixture.round})` : "";
  return `${home} vs ${away}${week}`;
}

export default function PredictionsAdmin() {
  const utils = trpc.useUtils();

  const { data: fixtures = [] } = trpc.getFixtures.useQuery();
  const [selectedMatchId, setSelectedMatchId] = useState<number | "">("");

  useEffect(() => {
    if (!selectedMatchId && fixtures.length > 0) {
      setSelectedMatchId(
        [...fixtures]
          .sort((a, b) => (b.kickoffAt ?? "").localeCompare(a.kickoffAt ?? ""))
          .find((fixture) => fixture.status === "final")?.id ?? fixtures[0].id
      );
    }
  }, [fixtures, selectedMatchId]);

  const selectedMatch = useMemo(
    () => fixtures.find((fixture) => fixture.id === selectedMatchId),
    [fixtures, selectedMatchId]
  );

  const { data: data, isLoading } = trpc.matchPredictionsList.useQuery(
    { matchId: Number(selectedMatchId) },
    { enabled: Boolean(selectedMatchId) }
  );

  const settle = trpc.settleMatch.useMutation({
    onSuccess: () => utils.matchPredictionsList.invalidate({ matchId: Number(selectedMatchId) }),
    onError: (error) => alert(`Could not settle: ${error.message}`),
  });

  const claim = trpc.setPrizeClaimed.useMutation({
    onSuccess: () => utils.matchPredictionsList.invalidate({ matchId: Number(selectedMatchId) }),
    onError: (error) => alert(`Could not update claim: ${error.message}`),
  });

  const handleSettle = () => {
    if (!selectedMatchId) return;
    const confirmed = window.confirm(
      "Settle this fixture's predictions? Eligible exact-score guesses will be marked, with the earliest submission winning."
    );
    if (confirmed) {
      settle.mutate({ matchId: Number(selectedMatchId) });
    }
  };

  const entries = data?.entries ?? [];
  const isFinal = selectedMatch?.status === "final";
  const exactGuesses = isFinal
    ? entries.filter(
        (entry) =>
          entry.guessedHomeGoals === selectedMatch.homeGoals &&
          entry.guessedAwayGoals === selectedMatch.awayGoals
      )
    : [];

  return (
    <AdminLayout>
      <section className="p-4 sm:p-6 text-white">
        <h3 className="text-2xl font-bold mb-2">Predictions</h3>
        <p className="text-sm text-slate-400 mb-6">
          Review entries per fixture, settle results, and confirm the prize has been awarded. Read
          how it works on the{" "}
          <Link to="/predict" className="underline" target="_blank" rel="noreferrer">
            public Predict page
          </Link>
          .
        </p>

        <div className="mb-6 flex flex-col sm:flex-row gap-4 sm:items-end">
          <div className="w-full sm:max-w-xs">
            <label htmlFor="predictMatchSelect" className="block text-sm mb-2">
              Fixture
            </label>
            <select
              id="predictMatchSelect"
              value={selectedMatchId}
              onChange={(e) => setSelectedMatchId(e.target.value ? Number(e.target.value) : "")}
              className="border py-2 px-4 rounded-xl w-full bg-[#333] text-white [color-scheme:dark]"
            >
              {fixtures.map((fixture) => (
                <option key={fixture.id} value={fixture.id}>
                  {fixtureLabel(fixture)} — {fixture.status}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleSettle}
            disabled={!isFinal || settle.isPending}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl disabled:opacity-50"
          >
            {settle.isPending ? "Settling..." : "Settle results"}
          </button>
        </div>

        {selectedMatch && (
          <div className="bg-[#333] rounded-xl p-4 mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <span className="font-bold">
              {selectedMatch.homeTeam?.teamName ?? "Team ?"} {selectedMatch.homeGoals ?? "–"} -{" "}
              {selectedMatch.awayGoals ?? "–"} {selectedMatch.awayTeam?.teamName ?? "Team ?"}
            </span>
            <span className="text-slate-400">{formatKickoff(selectedMatch)}</span>
            <span className="text-slate-400">{selectedMatch.prizeLabel}</span>
            <span className="text-slate-400">
              {entries.length} prediction{entries.length === 1 ? "" : "s"}
            </span>
            {isFinal && (
              <span className="text-xs text-green-300 font-bold">
                {exactGuesses.length} exact match{exactGuesses.length === 1 ? "" : "es"}
              </span>
            )}
          </div>
        )}

        <div className="w-full overflow-x-auto">
          {isLoading ? (
            <p className="text-slate-400">Loading predictions...</p>
          ) : entries.length === 0 ? (
            <p className="text-slate-400">No predictions for this fixture yet.</p>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-slate-300">
                <tr>
                  <th className="px-3 py-2">Submitted</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Guess</th>
                  <th className="px-3 py-2">Eligible</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Prize</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry: Entry) => {
                  const isExact =
                    isFinal &&
                    entry.guessedHomeGoals === selectedMatch.homeGoals &&
                    entry.guessedAwayGoals === selectedMatch.awayGoals;
                  const isWinner = entry.status === "won";

                  return (
                    <tr
                      key={entry.id}
                      className={`${isWinner ? "bg-green-900/40" : isExact ? "bg-amber-900/30" : "odd:bg-[#333] even:bg-[#262626]"}`}
                    >
                      <td className="px-3 py-3 text-xs text-slate-400">
                        {formatSubmitted(entry.submittedAt)}
                      </td>
                      <td className="px-3 py-3 font-semibold">{entry.playerName}</td>
                      <td className="px-3 py-3">
                        {entry.guessedHomeGoals} - {entry.guessedAwayGoals}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${
                            entry.eligible
                              ? "bg-green-200 text-green-800"
                              : "bg-gray-500 text-white"
                          }`}
                        >
                          {entry.eligible ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${
                            entry.status === "won"
                              ? "bg-yellow-300 text-yellow-900"
                              : entry.status === "lost"
                                ? "bg-gray-500 text-white"
                                : "bg-blue-200 text-blue-900"
                          }`}
                        >
                          {entry.status}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {isWinner ? (
                          <button
                            type="button"
                            onClick={() =>
                              claim.mutate({ entryId: entry.id, prizeClaimed: !entry.prizeClaimed })
                            }
                            disabled={claim.isPending}
                            className={`px-3 py-1 rounded-lg font-semibold text-xs ${
                              entry.prizeClaimed
                                ? "bg-white/20 text-white"
                                : "bg-green-500 hover:bg-green-600 text-white"
                            }`}
                          >
                            {entry.prizeClaimed ? "Claimed ✓" : "Mark claimed"}
                          </button>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </AdminLayout>
  );
}