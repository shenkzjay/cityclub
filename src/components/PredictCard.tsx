import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { trpc } from "../client/trpc";
import {
  formatKickoff,
  getSubmittedName,
  isFixtureOpen,
  rememberSubmittedName,
  type FixtureDto,
} from "../lib/fixtures";

export function PredictCard({ match }: { match: FixtureDto }) {
  const final = match.status === "final";
  const open = isFixtureOpen(match);

  const [name, setName] = useState("");
  const [homeGoals, setHomeGoals] = useState(0);
  const [awayGoals, setAwayGoals] = useState(0);
  const [submittedName, setSubmittedName] = useState<string | null>(() =>
    getSubmittedName(match.id)
  );

  const submit = trpc.predictionSubmit.useMutation();
  const utils = trpc.useUtils();

  const { data: predictionData } = trpc.getMatchPredictions.useQuery(
    { matchId: match.id },
    { enabled: final }
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmed = name.trim();
    if (!trimmed) {
      alert("Please enter your name to submit a prediction.");
      return;
    }

    try {
      const result = await submit.mutateAsync({
        matchId: match.id,
        playerName: trimmed,
        homeGoals,
        awayGoals,
      });

      rememberSubmittedName(match.id, result.playerName);
      setSubmittedName(result.playerName);
      await utils.getMatchPredictions.invalidate({ matchId: match.id });
      await utils.getFixtures.invalidate();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not submit your prediction.");
    }
  };

  const homeName = match.homeTeam?.teamName ?? `Team ${match.homeTeamId}`;
  const awayName = match.awayTeam?.teamName ?? `Team ${match.awayTeamId}`;

  return (
    <div className="bg-[#f8f0ed] border-2 border-dashed border-[#62381d] rounded-2xl p-5 sm:p-6 flex flex-col gap-4 text-black">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-extrabold text-[#62381d]">🎯 Predict &amp; Win</p>
        <span className="text-xs font-bold uppercase tracking-wide bg-[#62381d]/10 text-[#62381d] rounded-full px-2 py-0.5">
          {match.prizeLabel}
        </span>
      </div>

      <p className="font-bold text-base leading-tight">
        {homeName} <span className="text-[#62381d]/60">vs</span> {awayName}
      </p>

      <p className="text-xs font-semibold text-[#62381d]/70">
        {final ? "Final result" : open ? `Closes ${formatKickoff(match)}` : "Predictions closed"}
      </p>

      {final ? (
        <div className="flex flex-col gap-2 text-sm">
          <p className="font-black text-xl text-[#62381d]">
            {match.homeGoals} - {match.awayGoals}
          </p>
          {predictionData?.winner ? (
            <p>
              🏆 Winner:{" "}
              <span className="font-bold">{predictionData.winner.playerName}</span>
            </p>
          ) : (
            <p className="text-[#62381d]/70">
              No eligible entry matched the exact score — prize not awarded.
            </p>
          )}
        </div>
      ) : open ? (
        submittedName ? (
          <div className="rounded-xl bg-[#62381d]/10 px-4 py-3 text-sm">
            <p className="font-bold">You're in, {submittedName}!</p>
            <p className="text-[#62381d]/80 mt-1">
              Prediction recorded. Only registered league players are eligible for the prize.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3"
          >
            <div>
              <label htmlFor={`predict-name-${match.id}`} className="block text-xs font-bold mb-1">
                Your name
              </label>
              <input
                id={`predict-name-${match.id}`}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter the name you're registered with"
                className="w-full border-2 border-[#62381d]/20 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={`predict-home-${match.id}`} className="block text-xs font-bold mb-1">
                  {homeName} goals
                </label>
                <input
                  id={`predict-home-${match.id}`}
                  type="number"
                  min={0}
                  max={50}
                  value={homeGoals}
                  onChange={(e) => setHomeGoals(Math.max(0, Math.min(50, Number(e.target.value))))}
                  className="w-full border-2 border-[#62381d]/20 rounded-lg px-3 py-2 text-center text-lg font-bold"
                />
              </div>
              <div>
                <label htmlFor={`predict-away-${match.id}`} className="block text-xs font-bold mb-1">
                  {awayName} goals
                </label>
                <input
                  id={`predict-away-${match.id}`}
                  type="number"
                  min={0}
                  max={50}
                  value={awayGoals}
                  onChange={(e) => setAwayGoals(Math.max(0, Math.min(50, Number(e.target.value))))}
                  className="w-full border-2 border-[#62381d]/20 rounded-lg px-3 py-2 text-center text-lg font-bold"
                />
              </div>
            </div>

            <p className="text-[10px] text-[#62381d]/60 font-semibold">
              Guess the exact score. Be the first eligible player to match it and win{" "}
              {match.prizeLabel.toLowerCase()}.
            </p>

            <button
              type="submit"
              disabled={submit.isPending}
              className="w-full bg-[#62381d] text-[#f8f0ed] font-bold rounded-lg py-2.5 hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              {submit.isPending ? "Submitting..." : "Submit prediction"}
            </button>
          </form>
        )
      ) : (
        <p className="text-sm text-[#62381d]/70">
          This fixture is no longer open for predictions.{" "}
          <Link to="/predict" className="underline">
            See all predictions
          </Link>
          .
        </p>
      )}
    </div>
  );
}