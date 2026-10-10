import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "../layout";
import { trpc } from "../../client/trpc";
import {
  TeamOfTheWeekPitch,
  type TeamOfTheWeekDto,
  type TotwPlayerDto,
} from "../../components/TeamOfTheWeekPitch";

type SlotKey =
  | "defenderOneId"
  | "defenderTwoId"
  | "midfielderId"
  | "forwardOneId"
  | "forwardTwoId"
  | "subOneId"
  | "subTwoId"
  | "subThreeId"
  | "subFourId";

const SLOTS: { key: SlotKey; label: string }[] = [
  { key: "defenderOneId", label: "Defender 1" },
  { key: "defenderTwoId", label: "Defender 2" },
  { key: "midfielderId", label: "Midfielder 1" },
  { key: "forwardOneId", label: "Forward 1" },
  { key: "forwardTwoId", label: "Forward 2" },
  { key: "subOneId", label: "Substitute 1" },
  { key: "subTwoId", label: "Substitute 2" },
  { key: "subThreeId", label: "Substitute 3" },
  { key: "subFourId", label: "Substitute 4" },
];

const EMPTY_VALUES: Record<SlotKey, number | ""> = {
  defenderOneId: "",
  defenderTwoId: "",
  midfielderId: "",
  forwardOneId: "",
  forwardTwoId: "",
  subOneId: "",
  subTwoId: "",
  subThreeId: "",
  subFourId: "",
};

export default function TotwAdmin() {
  const utils = trpc.useUtils();

  const { data: teams = [] } = trpc.getTeams.useQuery();
  const { data: players = [] } = trpc.getPlayers.useQuery();
  const { data: totw } = trpc.getTeamOfTheWeek.useQuery();
  const { data: activeCompetition } = trpc.getActiveCompetition.useQuery();

  const [values, setValues] = useState<Record<SlotKey, number | "">>(EMPTY_VALUES);
  const [weekLabel, setWeekLabel] = useState("");

  useEffect(() => {
    if (!totw) return;
    setValues({
      defenderOneId: totw.defenderOne?.id ?? "",
      defenderTwoId: totw.defenderTwo?.id ?? "",
      midfielderId: totw.midfielder?.id ?? "",
      forwardOneId: totw.forwardOne?.id ?? "",
      forwardTwoId: totw.forwardTwo?.id ?? "",
      subOneId: totw.subOne?.id ?? "",
      subTwoId: totw.subTwo?.id ?? "",
      subThreeId: totw.subThree?.id ?? "",
      subFourId: totw.subFour?.id ?? "",
    });
    setWeekLabel(totw.weekLabel ?? "");
  }, [totw]);

  const teamById = useMemo(() => {
    const map = new Map<number, { id: number; teamName: string; color: string }>();
    for (const team of teams) {
      map.set(team.id, { id: team.id, teamName: team.teamName, color: team.color });
    }
    return map;
  }, [teams]);

  const groupedPlayers = useMemo(() => {
    const groups = new Map<string, { id: number; playerName: string; teamName: string }[]>();
    for (const player of players) {
      const team = player.teamId ? teamById.get(player.teamId) : undefined;
      const groupLabel = team ? team.teamName : "Free agents";
      const list = groups.get(groupLabel) ?? [];
      list.push({
        id: player.id,
        playerName: player.playerName,
        teamName: team?.teamName ?? "Free agent",
      });
      groups.set(groupLabel, list);
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [players, teamById]);

  const previewById = useMemo(() => {
    const map = new Map<number, TotwPlayerDto>();
    for (const player of players) {
      const team = player.teamId ? teamById.get(player.teamId) : undefined;
      map.set(player.id, {
        id: player.id,
        playerName: player.playerName,
        goals: player.goals,
        assists: player.assists,
        yellowCard: player.yellowCard,
        redCard: player.redCard,
        team: team ? { id: team.id, teamName: team.teamName, color: team.color } : null,
      });
    }
    return map;
  }, [players, teamById]);

  const preview: TeamOfTheWeekDto | null = {
    id: totw?.id ?? 0,
    weekLabel: weekLabel || null,
    competitionId: activeCompetition?.id ?? 0,
    competitionName: activeCompetition?.name ?? null,
    updatedAt: totw?.updatedAt ?? new Date(0).toISOString(),
    defenderOne: previewById.get(values.defenderOneId as number) ?? null,
    defenderTwo: previewById.get(values.defenderTwoId as number) ?? null,
    midfielder: previewById.get(values.midfielderId as number) ?? null,
    forwardOne: previewById.get(values.forwardOneId as number) ?? null,
    forwardTwo: previewById.get(values.forwardTwoId as number) ?? null,
    subOne: previewById.get(values.subOneId as number) ?? null,
    subTwo: previewById.get(values.subTwoId as number) ?? null,
    subThree: previewById.get(values.subThreeId as number) ?? null,
    subFour: previewById.get(values.subFourId as number) ?? null,
  };

  const hasAnySelection = SLOTS.some((slot) => values[slot.key] !== "");
  const hasStarter = SLOTS.slice(0, 5).some((slot) => values[slot.key] !== "");

  const upsert = trpc.upsertTeamOfTheWeek.useMutation({
    onSuccess: () => {
      utils.getTeamOfTheWeek.invalidate();
      alert("Team of the Week saved.");
    },
    onError: (error) => alert(`Could not save: ${error.message}`),
  });

  const handleSave = () => {
    upsert.mutate({
      weekLabel: weekLabel.trim(),
      defenderOneId: values.defenderOneId === "" ? null : (values.defenderOneId as number),
      defenderTwoId: values.defenderTwoId === "" ? null : (values.defenderTwoId as number),
      midfielderId: values.midfielderId === "" ? null : (values.midfielderId as number),
      forwardOneId: values.forwardOneId === "" ? null : (values.forwardOneId as number),
      forwardTwoId: values.forwardTwoId === "" ? null : (values.forwardTwoId as number),
      subOneId: values.subOneId === "" ? null : (values.subOneId as number),
      subTwoId: values.subTwoId === "" ? null : (values.subTwoId as number),
      subThreeId: values.subThreeId === "" ? null : (values.subThreeId as number),
      subFourId: values.subFourId === "" ? null : (values.subFourId as number),
    });
  };

  return (
    <AdminLayout>
      <section className="p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h3 className="text-2xl font-bold">Team of the Week</h3>
            <p className="text-sm text-slate-400 mt-1">
              Pick the 5 starters (2-1-2) and 4 substitutes for{" "}
              {activeCompetition?.name ?? "the active competition"}.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={upsert.isPending}
            className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl disabled:opacity-50"
          >
            {upsert.isPending ? "Saving..." : "Save team"}
          </button>
        </div>

        {!hasStarter && !hasAnySelection && totw == null && (
          <p className="text-slate-400 mb-4">No team selected yet — build one below.</p>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="w-full overflow-x-auto">
            <div className="mb-6">
              <label htmlFor="totwWeekLabel" className="block text-sm mb-2">
                Week label (optional)
              </label>
              <input
                id="totwWeekLabel"
                type="text"
                value={weekLabel}
                onChange={(e) => setWeekLabel(e.target.value)}
                placeholder="e.g. Match week 4"
                className="border py-2 px-4 rounded-xl w-full bg-[#333] text-white"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-x-4 gap-y-4">
              {SLOTS.map((slot) => (
                <div key={slot.key}>
                  <label
                    htmlFor={`totw-${slot.key}`}
                    className="block text-sm mb-2 font-semibold"
                  >
                    {slot.label}
                  </label>
                  <select
                    id={`totw-${slot.key}`}
                    value={values[slot.key]}
                    onChange={(e) =>
                      setValues((prev) => ({
                        ...prev,
                        [slot.key]: e.target.value ? Number(e.target.value) : "",
                      }))
                    }
                    className="border py-2 px-4 rounded-xl w-full bg-[#333] text-white [color-scheme:dark]"
                  >
                    <option value="">— none —</option>
                    {groupedPlayers.map(([groupName, groupPlayers]) => (
                      <optgroup key={groupName} label={groupName}>
                        {groupPlayers.map((player) => (
                          <option key={player.id} value={player.id}>
                            {player.playerName} — {player.teamName}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="min-w-0">
            <p className="text-sm text-slate-400 mb-3">Live preview</p>
            <TeamOfTheWeekPitch teamOfTheWeek={preview} />
          </div>
        </div>
      </section>
    </AdminLayout>
  );
}