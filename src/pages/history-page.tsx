import { Link } from "react-router";
import { trpc } from "../client/trpc";

function championOf(teams: { teamName: string; score?: { points: number } | null }[]) {
  if (!teams || teams.length === 0) {
    return null;
  }

  const sorted = [...teams].sort((a, b) => (b.score?.points ?? 0) - (a.score?.points ?? 0));

  if ((sorted[0].score?.points ?? 0) === 0) {
    return null;
  }

  return sorted[0].teamName;
}

export default function HistoryPage() {
  const { data: competitions = [], isLoading, isError } = trpc.competitionsList.useQuery();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex flex-row items-center gap-4 mb-8 text-[brown]">
        <Link to="/">← Back</Link>
        <h1 className="text-3xl font-bold">Competition History</h1>
      </div>

      <p className="text-sm text-gray-500 mb-6">
        Every past and present competition is kept here. Nothing is ever erased — starting a new
        competition simply opens a fresh season.
      </p>

      {isLoading && <div>Loading competitions...</div>}

      {isError && <div className="text-red-500">Failed to load competitions.</div>}

      {!isLoading && !isError && competitions.length === 0 && (
        <div className="bg-[#f8f0ed] rounded-xl p-6 text-[brown]">No competitions yet.</div>
      )}

      <ul className="grid gap-4">
        {competitions.map((competition) => {
          const champion = championOf(competition.teams);

          return (
            <li key={competition.id}>
              <Link
                to={`/history/${competition.id}`}
                className="block bg-[#f8f0ed] hover:bg-[#fac4a3] rounded-xl p-6 text-[brown] transition-colors"
              >
                <div className="flex flex-row items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold">{competition.name}</h2>
                    <p className="text-sm mt-1">
                      {competition.teams.length} team{competition.teams.length === 1 ? "" : "s"}
                      {champion ? ` • Champion: ${champion}` : ""}
                    </p>
                  </div>
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
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
