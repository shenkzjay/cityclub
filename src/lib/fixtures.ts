export type FixtureDto = {
  id: number;
  round: number | null;
  kickoffAt: string | null;
  status: string;
  prizeLabel: string;
  matchDate: string;
  homeGoals: number | null;
  awayGoals: number | null;
  competitionId: number | null;
  homeTeamId: number | null;
  awayTeamId: number | null;
  roastNote: string | null;
  homeTeam: { id: number; teamName: string; color: string } | null;
  awayTeam: { id: number; teamName: string; color: string } | null;
};

const STORAGE_PREFIX = "cityclub-prediction:";

// Predictions close this many minutes before kickoff (7:00 AM for an 8:00 AM match).
export const PREDICTION_LEAD_MINUTES = 60;

function formatDateTime(date: Date): string {
  return date.toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Timestamp (ms) at which predictions for a fixture close, or null if unknown.
export function predictionDeadline(match: FixtureDto): number | null {
  if (!match.kickoffAt) {
    return null;
  }
  const kickoff = new Date(match.kickoffAt).getTime();
  if (Number.isNaN(kickoff)) {
    return null;
  }
  return kickoff - PREDICTION_LEAD_MINUTES * 60 * 1000;
}

export function isFixtureOpen(match: FixtureDto): boolean {
  const deadline = predictionDeadline(match);
  return match.status !== "final" && deadline != null && deadline > Date.now();
}

// The next matchday is the lowest round that still has an unfinished fixture.
export function getNextPredictionRound(fixtures: FixtureDto[]): number | null {
  const rounds = fixtures
    .filter((fixture) => fixture.status !== "final" && fixture.round != null)
    .map((fixture) => fixture.round as number);

  return rounds.length > 0 ? Math.min(...rounds) : null;
}

// Predictions are only accepted for the next matchday, before its deadline.
export function isPredictionOpen(match: FixtureDto, nextRound: number | null): boolean {
  if (match.status === "final" || nextRound == null || match.round !== nextRound) {
    return false;
  }
  const deadline = predictionDeadline(match);
  return deadline != null && deadline > Date.now();
}

export function formatKickoff(match: FixtureDto): string {
  if (!match.kickoffAt) {
    return match.matchDate;
  }
  const date = new Date(match.kickoffAt);
  if (Number.isNaN(date.getTime())) {
    return match.matchDate;
  }
  return formatDateTime(date);
}

export function formatDeadline(match: FixtureDto): string {
  const deadline = predictionDeadline(match);
  if (deadline == null) {
    return match.matchDate;
  }
  return formatDateTime(new Date(deadline));
}

export function getSubmittedName(matchId: number): string | null {
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${matchId}`);
  } catch {
    return null;
  }
}

export function rememberSubmittedName(matchId: number, name: string): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${matchId}`, name);
  } catch {
    // storage unavailable - ignore
  }
}