export type RoastEntry = {
  id: number;
  playerName: string;
  homeGoals: number;
  awayGoals: number;
  eligible: boolean;
  status: string;
  submittedAt: string;
};

export type RoastMatch = {
  homeTeam: { teamName: string } | null;
  awayTeam: { teamName: string } | null;
  homeTeamId: number | null;
  awayTeamId: number | null;
  homeGoals: number | null;
  awayGoals: number | null;
  roastNote: string | null;
};

function goalError(entry: RoastEntry, homeGoals: number, awayGoals: number): number {
  return Math.abs(entry.homeGoals - homeGoals) + Math.abs(entry.awayGoals - awayGoals);
}

// The unluckiest predictor: the eligible non-winner whose guess was closest to the
// final score (smallest total goal error), with the earliest submission breaking ties.
export function pickUnluckiest(
  entries: RoastEntry[],
  homeGoals: number | null,
  awayGoals: number | null,
): RoastEntry | null {
  if (homeGoals == null || awayGoals == null) {
    return null;
  }

  const candidates = entries
    .filter((entry) => entry.eligible && entry.status !== "won")
    .slice()
    .sort((a, b) => {
      const diff = goalError(a, homeGoals, awayGoals) - goalError(b, homeGoals, awayGoals);
      if (diff !== 0) return diff;
      return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
    });

  return candidates[0] ?? null;
}

function defaultRoastLine(
  entry: RoastEntry,
  homeGoals: number,
  awayGoals: number,
): string {
  const error = goalError(entry, homeGoals, awayGoals);
  if (error === 0) {
    return "matched the exact score but was a moment too late!";
  }
  if (error === 1) {
    return "was one goal away — so close!";
  }
  return `missed by ${error} goals.`;
}

// Builds the paste-ready WhatsApp message for a settled fixture.
export function buildRoastMessage({
  match,
  winner,
  unluckiest,
}: {
  match: RoastMatch;
  winner: RoastEntry | null;
  unluckiest: RoastEntry | null;
}): string {
  const home = match.homeTeam?.teamName ?? `Team ${match.homeTeamId ?? "?"}`;
  const away = match.awayTeam?.teamName ?? `Team ${match.awayTeamId ?? "?"}`;
  const scoreHome = match.homeGoals ?? "-";
  const scoreAway = match.awayGoals ?? "-";

  const lines = [`🚨 MATCH RESULT: ${home} ${scoreHome} - ${scoreAway} ${away}`];

  if (winner) {
    lines.push(`* 🏆 Predictor Winner: @${winner.playerName} (Exact Score!)`);
  } else {
    lines.push("* 🏆 Predictor Winner: nobody nailed it 😅");
  }

  if (unluckiest && match.homeGoals != null && match.awayGoals != null) {
    const note =
      match.roastNote?.trim() || defaultRoastLine(unluckiest, match.homeGoals, match.awayGoals);
    lines.push(
      `* 😭 Unluckiest: @${unluckiest.playerName} predicted ${unluckiest.homeGoals}-${unluckiest.awayGoals}. ${note}`,
    );
  }

  return lines.join("\n");
}
