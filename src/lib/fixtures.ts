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
  homeTeam: { id: number; teamName: string; color: string } | null;
  awayTeam: { id: number; teamName: string; color: string } | null;
};

const STORAGE_PREFIX = "cityclub-prediction:";

export function isFixtureOpen(match: FixtureDto): boolean {
  return match.status !== "final" && match.kickoffAt != null && new Date(match.kickoffAt).getTime() > Date.now();
}

export function formatKickoff(match: FixtureDto): string {
  if (!match.kickoffAt) {
    return match.matchDate;
  }
  const date = new Date(match.kickoffAt);
  if (Number.isNaN(date.getTime())) {
    return match.matchDate;
  }
  return date.toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
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