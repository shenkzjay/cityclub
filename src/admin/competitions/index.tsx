import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { AdminLayout } from "../layout";
import { trpc } from "../../client/trpc";
import { PageLoader } from "../../components/PageLoader";

export default function CompetitionsAdmin() {
  const utils = trpc.useUtils();
  const [name, setName] = useState("");

  const {
    data: competitions = [],
    isLoading: competitionsLoading,
  } = trpc.competitionsList.useQuery();

  const activeCompetition = competitions.find((competition) => competition.status === "active");

  const creator = trpc.competitionCreate.useMutation({
    onSuccess: () => {
      utils.competitionsList.invalidate();
      utils.getActiveCompetition.invalidate();
      utils.getTeams.invalidate();
      utils.getPlayers.invalidate();
      utils.getUnassignedPlayers.invalidate();
      setName("");
      alert("New competition created. Previous season archived.");
    },
    onError: (error) => {
      alert(`Failed to create competition: ${error.message}`);
    },
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Please enter a competition name.");
      return;
    }

    const confirmed = window.confirm(
      activeCompetition
        ? `This will archive "${activeCompetition.name}" and start "${name.trim()}" with all stats reset to zero.\n\nExisting data is kept and can be viewed under History. Continue?`
        : `Start a new competition named "${name.trim()}"?`
    );

    if (!confirmed) {
      return;
    }

    await creator.mutateAsync({ name: name.trim() });
  };

  if (competitionsLoading) {
    return (
      <AdminLayout>
        <PageLoader invert label="Loading competitions…" />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <section className="flex flex-col lg:flex-row gap-8 lg:gap-12 p-4 sm:p-6 text-white">
        <section className="w-full lg:w-1/2">
          <h3 className="text-2xl font-bold mb-2">Start a new competition</h3>
          <p className="text-sm text-slate-400 mb-6">
            The current active competition is archived (never deleted) and its teams and players are
            carried into the new season with every stat reset to zero.
          </p>

          <form onSubmit={handleSubmit}>
            <fieldset className="grid gap-6 border p-6 rounded-xl">
              <legend>New competition</legend>

              <div>
                <label htmlFor="name" className="sr-only">
                  Competition name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  placeholder="e.g. 2026 League Cup"
                  className="border py-2 px-4 rounded-xl w-full bg-transparent"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={creator.isPending}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl disabled:opacity-50"
              >
                {creator.isPending ? "Creating..." : "Start new competition"}
              </button>
            </fieldset>
          </form>
        </section>

        <section className="w-full lg:w-1/2 min-w-0">
          <h3 className="text-2xl font-bold mb-6">All competitions</h3>
          <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Teams</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {competitions.length > 0 ? (
                competitions.map((competition, idx) => (
                  <tr key={competition.id} className="odd:bg-[#333] even:bg-[#262626]">
                    <td className="px-3 py-2">{idx + 1}</td>
                    <td className="px-3 py-2">{competition.name}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${
                          competition.status === "active"
                            ? "bg-green-200 text-green-800"
                            : "bg-gray-500 text-white"
                        }`}
                      >
                        {competition.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">{competition.teams.length}</td>
                    <td className="px-3 py-2">
                      <Link to={`/history/${competition.id}`} className="underline">
                        view →
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-3 py-2">No competitions yet.</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </section>
      </section>
    </AdminLayout>
  );
}
