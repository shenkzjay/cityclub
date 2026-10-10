import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { AdminLayout } from "../layout";
import { trpc } from "../../client/trpc";
import { formatKickoff, type FixtureDto } from "../../lib/fixtures";

function toLocalInputValue(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export default function FixturesAdmin() {
  const utils = trpc.useUtils();

  const { data: fixtures = [], isLoading } = trpc.getFixtures.useQuery();
  const { data: teams = [] } = trpc.getTeams.useQuery();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [homeTeamId, setHomeTeamId] = useState<number | "">("");
  const [awayTeamId, setAwayTeamId] = useState<number | "">("");
  const [round, setRound] = useState(1);
  const [kickoff, setKickoff] = useState("");
  const [prizeLabel, setPrizeLabel] = useState("₦2,000 airtime");

  const invalidate = () => utils.getFixtures.invalidate();

  const creator = trpc.fixtureCreate.useMutation({
    onSuccess: () => {
      invalidate();
      resetForm();
    },
    onError: (error) => alert(`Could not create fixture: ${error.message}`),
  });

  const updater = trpc.fixtureUpdate.useMutation({
    onSuccess: () => {
      invalidate();
      resetForm();
    },
    onError: (error) => alert(`Could not update fixture: ${error.message}`),
  });

  const deleter = trpc.fixtureDelete.useMutation({
    onSuccess: () => invalidate(),
    onError: (error) => alert(`Could not delete fixture: ${error.message}`),
  });

  const isSaving = creator.isPending || updater.isPending;

  const byRound = useMemo(() => {
    const groups = new Map<number, FixtureDto[]>();
    for (const fixture of fixtures) {
      if (fixture.round == null) continue;
      const list = groups.get(fixture.round) ?? [];
      list.push(fixture);
      groups.set(fixture.round, list);
    }
    return [...groups.entries()].sort((a, b) => a[0] - b[0]);
  }, [fixtures]);

  function resetForm() {
    setEditingId(null);
    setHomeTeamId("");
    setAwayTeamId("");
    setRound(1);
    setKickoff("");
    setPrizeLabel("₦2,000 airtime");
  }

  const handleEdit = (fixture: FixtureDto) => {
    setEditingId(fixture.id);
    setHomeTeamId(fixture.homeTeamId ?? "");
    setAwayTeamId(fixture.awayTeamId ?? "");
    setRound(fixture.round ?? 1);
    setKickoff(fixture.kickoffAt ? toLocalInputValue(fixture.kickoffAt) : "");
    setPrizeLabel(fixture.prizeLabel);
  };

  const handleDelete = (fixture: FixtureDto) => {
    if (!window.confirm(`Delete ${fixture.homeTeam?.teamName} vs ${fixture.awayTeam?.teamName}?`)) {
      return;
    }
    if (editingId === fixture.id) {
      resetForm();
    }
    deleter.mutate({ id: fixture.id });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!homeTeamId || !awayTeamId) {
      alert("Please select both home and away teams.");
      return;
    }
    if (homeTeamId === awayTeamId) {
      alert("Home and away teams cannot be the same.");
      return;
    }
    if (!kickoff) {
      alert("Please set the kickoff date and time.");
      return;
    }

    const payload = {
      homeTeamId,
      awayTeamId,
      round,
      kickoffAt: new Date(kickoff).toISOString(),
      prizeLabel: prizeLabel.trim(),
    };

    try {
      if (editingId) {
        await updater.mutateAsync({ id: editingId, ...payload });
      } else {
        await creator.mutateAsync(payload);
      }
    } catch {
      // errors surfaced via onError handlers
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 text-white">Loading fixtures...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <section className="flex flex-col lg:flex-row gap-8 lg:gap-12 p-4 sm:p-6 text-white">
        <section className="w-full lg:w-1/2 min-w-0">
          <h3 className="text-2xl font-bold mb-2">
            {editingId ? "Edit fixture" : "Schedule a new fixture"}
          </h3>
          <p className="text-sm text-slate-400 mb-6">
            Fixtures live in the database. Record the result afterwards on the{" "}
            <Link to="/admin/points/points-update" className="underline">
              Scores
            </Link>{" "}
            page.
          </p>

          <form onSubmit={handleSubmit}>
            <fieldset className="grid gap-6 border p-6 rounded-xl">
              <legend>{editingId ? "Edit fixture" : "New fixture"}</legend>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="fixtureHomeTeam" className="block text-sm mb-2">
                    Home team
                  </label>
                  <select
                    id="fixtureHomeTeam"
                    value={homeTeamId}
                    onChange={(e) => {
                      const value = e.target.value ? Number(e.target.value) : "";
                      setHomeTeamId(value);
                      if (value === awayTeamId) setAwayTeamId("");
                    }}
                    className="border py-2 px-4 rounded-xl w-full bg-transparent"
                  >
                    <option value="">Select team</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.teamName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="fixtureAwayTeam" className="block text-sm mb-2">
                    Away team
                  </label>
                  <select
                    id="fixtureAwayTeam"
                    value={awayTeamId}
                    onChange={(e) =>
                      setAwayTeamId(e.target.value ? Number(e.target.value) : "")
                    }
                    className="border py-2 px-4 rounded-xl w-full bg-transparent"
                  >
                    <option value="">Select team</option>
                    {teams
                      .filter((team) => team.id !== homeTeamId)
                      .map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.teamName}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="fixtureRound" className="block text-sm mb-2">
                    Match week (round)
                  </label>
                  <input
                    id="fixtureRound"
                    type="number"
                    min={1}
                    value={round}
                    onChange={(e) => setRound(Math.max(1, Number(e.target.value)))}
                    className="border py-2 px-4 rounded-xl w-full bg-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="fixtureKickoff" className="block text-sm mb-2">
                    Kickoff
                  </label>
                  <input
                    id="fixtureKickoff"
                    type="datetime-local"
                    value={kickoff}
                    onChange={(e) => setKickoff(e.target.value)}
                    className="border py-2 px-4 rounded-xl w-full bg-transparent [color-scheme:dark]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="fixturePrize" className="block text-sm mb-2">
                  Prize label
                </label>
                <input
                  id="fixturePrize"
                  type="text"
                  value={prizeLabel}
                  onChange={(e) => setPrizeLabel(e.target.value)}
                  placeholder="₦2,000 airtime"
                  className="border py-2 px-4 rounded-xl w-full bg-transparent"
                />
              </div>

              <div className="flex flex-wrap gap-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : editingId ? "Update fixture" : "Create fixture"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </fieldset>
          </form>
        </section>

        <section className="w-full lg:w-1/2 min-w-0">
          <h3 className="text-2xl font-bold mb-6">Fixtures</h3>

          {fixtures.length === 0 ? (
            <p className="text-slate-400">No fixtures yet.</p>
          ) : (
            <div className="flex flex-col gap-8">
              {byRound.map(([week, weekFixtures]) => (
                <div key={week}>
                  <p className="text-sm font-bold uppercase tracking-wide text-slate-400 mb-3">
                    Match week {week}
                  </p>
                  <div className="grid gap-3">
                    {weekFixtures.map((fixture) => (
                      <div
                        key={fixture.id}
                        className="bg-[#333] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">
                            {fixture.homeTeam?.teamName ?? "Team ?"} vs{" "}
                            {fixture.awayTeam?.teamName ?? "Team ?"}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {formatKickoff(fixture)}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2 text-xs">
                            <span
                              className={`font-bold uppercase px-2 py-0.5 rounded-full ${
                                fixture.status === "final"
                                  ? "bg-green-200 text-green-800"
                                  : "bg-slate-500 text-white"
                              }`}
                            >
                              {fixture.status}
                            </span>
                            {fixture.homeGoals != null && (
                              <span className="font-bold text-white">
                                {fixture.homeGoals} - {fixture.awayGoals}
                              </span>
                            )}
                            <span className="text-slate-400">{fixture.prizeLabel}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 text-sm shrink-0">
                          <button
                            type="button"
                            onClick={() => handleEdit(fixture)}
                            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(fixture)}
                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg"
                          >
                            Delete
                          </button>
                          <Link
                            to="/admin/points/points-update"
                            className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg"
                          >
                            Scores →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>
    </AdminLayout>
  );
}