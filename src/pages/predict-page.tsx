import { useMemo } from "react";
import { Link } from "react-router";
import { trpc } from "../client/trpc";
import { PredictCard } from "../components/PredictCard";
import { isFixtureOpen, type FixtureDto } from "../lib/fixtures";

type Section = "open" | "finished" | "closed";

function sectionOf(match: FixtureDto): Section {
  if (match.status === "final") return "finished";
  if (isFixtureOpen(match)) return "open";
  return "closed";
}

export function PredictPage() {
  const { data: matches = [] } = trpc.getFixtures.useQuery(undefined, {
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  const { open, finished, closed } = useMemo(() => {
    const open: FixtureDto[] = [];
    const finished: FixtureDto[] = [];
    const closed: FixtureDto[] = [];

    for (const match of matches) {
      if (sectionOf(match) === "open") open.push(match);
      else if (sectionOf(match) === "finished") finished.push(match);
      else closed.push(match);
    }

    open.sort((a, b) => (a.kickoffAt ?? "").localeCompare(b.kickoffAt ?? ""));
    finished.sort((a, b) => (b.kickoffAt ?? "").localeCompare(a.kickoffAt ?? ""));
    closed.sort((a, b) => (b.kickoffAt ?? "").localeCompare(a.kickoffAt ?? ""));

    return { open, finished, closed };
  }, [matches]);

  return (
    <section className="mx-auto max-w-4xl px-6 py-10 flex flex-col gap-10 bg-white min-h-screen">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#62381d]">🎯 Predict &amp; Win</h1>
          <p className="text-sm text-[#62381d]/70 mt-1">
            Enter your name and guess the exact score of a fixture. The first eligible
            participant to match the score wins the airtime prize.
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
                <PredictCard match={match} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[#62381d]/70 bg-[#f8f0ed] rounded-xl px-4 py-3">
            No fixtures are open for predictions right now. Check back when the next fixture is
            scheduled.
          </p>
        )}
      </section>

      {finished.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-black mb-4">Settled</h2>
          <ul className="grid sm:grid-cols-2 gap-6">
            {finished.map((match) => (
              <li key={match.id}>
                <PredictCard match={match} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {closed.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-black mb-4">Closed</h2>
          <ul className="grid sm:grid-cols-2 gap-6">
            {closed.map((match) => (
              <li key={match.id}>
                <PredictCard match={match} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}

export default PredictPage;