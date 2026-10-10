import { useMemo } from "react";
import { Link } from "react-router";
import { keepPreviousData } from "@tanstack/react-query";
import { trpc } from "../client/trpc";
import { PredictCard } from "../components/PredictCard";
import { PageLoader } from "../components/PageLoader";
import {
  formatKickoff,
  getNextPredictionRound,
  isPredictionOpen,
  type FixtureDto,
} from "../lib/fixtures";

export function PredictPage() {
  const { data: matches = [], isLoading } = trpc.getFixtures.useQuery(undefined, {
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  });

  const { open, awaiting, upcoming, finished } = useMemo(() => {
    const nextRound = getNextPredictionRound(matches);

    const open: FixtureDto[] = [];
    const awaiting: FixtureDto[] = [];
    const upcoming: FixtureDto[] = [];
    const finished: FixtureDto[] = [];

    for (const match of matches) {
      if (match.status === "final") {
        finished.push(match);
        continue;
      }

      if (nextRound != null && match.round === nextRound) {
        if (isPredictionOpen(match, nextRound)) open.push(match);
        else awaiting.push(match);
        continue;
      }

      upcoming.push(match);
    }

    const byKickoffAsc = (a: FixtureDto, b: FixtureDto) =>
      (a.kickoffAt ?? "").localeCompare(b.kickoffAt ?? "");
    const byKickoffDesc = (a: FixtureDto, b: FixtureDto) =>
      (b.kickoffAt ?? "").localeCompare(a.kickoffAt ?? "");

    open.sort(byKickoffAsc);
    awaiting.sort(byKickoffAsc);
    upcoming.sort(byKickoffAsc);
    finished.sort(byKickoffDesc);

    return { open, awaiting, upcoming, finished };
  }, [matches]);

  if (isLoading) {
    return (
      <section className="mx-auto max-w-4xl px-6 py-10 bg-white min-h-screen">
        <PageLoader label="Loading predictions…" />
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl px-6 py-10 flex flex-col gap-10 bg-white min-h-screen">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#62381d]">🎯 Predict &amp; Win</h1>
          <p className="text-sm text-[#62381d]/70 mt-1">
            Enter your name and guess the exact score. Predictions open one matchday at a time and
            close 1 hour before kickoff. The first eligible participant to match the score wins the
            airtime prize.
          </p>
        </div>
        <Link to="/" className="text-sm underline hover:no-underline">
          ← Back home
        </Link>
      </div>

      <section>
        <h2 className="text-lg font-bold text-black mb-4">Open for predictions</h2>
        {open.length > 0 ? (
          <ul className="grid sm:grid-cols-2 gap-6">
            {open.map((match) => (
              <li key={match.id}>
                <PredictCard match={match} predictable />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[#62381d]/70 bg-[#f8f0ed] rounded-xl px-4 py-3">
            No fixtures are open for predictions right now. The next matchday opens once the
            current one is settled.
          </p>
        )}
      </section>

      {awaiting.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-black mb-4">Awaiting result</h2>
          <ul className="grid sm:grid-cols-2 gap-6">
            {awaiting.map((match) => (
              <li key={match.id}>
                <PredictCard match={match} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {finished.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-black mb-4">Settled</h2>
          <ul className="grid sm:grid-cols-2 gap-6">
            {finished.map((match) => (
              <li key={match.id}>
                <PredictCard match={match} showRoast />
              </li>
            ))}
          </ul>
        </section>
      )}

      {upcoming.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-black mb-2">Upcoming</h2>
          <p className="text-sm text-[#62381d]/70 mb-4">
            These fixtures open for predictions matchday by matchday.
          </p>
          <ul className="grid sm:grid-cols-2 gap-3">
            {upcoming.map((match) => {
              const homeName = match.homeTeam?.teamName ?? `Team ${match.homeTeamId ?? "?"}`;
              const awayName = match.awayTeam?.teamName ?? `Team ${match.awayTeamId ?? "?"}`;
              return (
                <li
                  key={match.id}
                  className="bg-[#f8f0ed] border-2 border-dashed border-[#62381d]/40 rounded-2xl p-4 text-black"
                >
                  <p className="font-bold">
                    {homeName} <span className="text-[#62381d]/60">vs</span> {awayName}
                  </p>
                  <p className="text-xs text-[#62381d]/70 mt-1">{formatKickoff(match)}</p>
                  <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wide bg-[#62381d]/10 text-[#62381d] rounded-full px-2 py-0.5">
                    🔒 Predictions locked
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </section>
  );
}

export default PredictPage;
