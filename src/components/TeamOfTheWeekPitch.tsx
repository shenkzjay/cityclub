import { Jersey } from "./Jersey";
import { teamColors } from "../lib/teamColors";

export interface TotwPlayerDto {
  id: number;
  playerName: string;
  goals: number;
  assists: number;
  yellowCard: number;
  redCard: number;
  team: { id: number; teamName: string; color: string } | null;
}

export interface TeamOfTheWeekDto {
  id: number;
  weekLabel: string | null;
  competitionId: number;
  competitionName: string | null;
  updatedAt: string;
  defenderOne: TotwPlayerDto | null;
  defenderTwo: TotwPlayerDto | null;
  midfielder: TotwPlayerDto | null;
  forwardOne: TotwPlayerDto | null;
  forwardTwo: TotwPlayerDto | null;
  subOne: TotwPlayerDto | null;
  subTwo: TotwPlayerDto | null;
  subThree: TotwPlayerDto | null;
  subFour: TotwPlayerDto | null;
}

type PlayerSlotKey =
  | "defenderOne"
  | "defenderTwo"
  | "midfielder"
  | "forwardOne"
  | "forwardTwo"
  | "subOne"
  | "subTwo"
  | "subThree"
  | "subFour";

type PositionKey = "defenderOne" | "defenderTwo" | "midfielder" | "forwardOne" | "forwardTwo";

const STARTER_SLOTS: { key: PositionKey; position: string; left: string; top: string }[] = [
  { key: "forwardOne", position: "FW", left: "27%", top: "22%" },
  { key: "forwardTwo", position: "FW", left: "73%", top: "22%" },
  { key: "midfielder", position: "MF", left: "50%", top: "46%" },
  { key: "defenderOne", position: "DF", left: "27%", top: "72%" },
  { key: "defenderTwo", position: "DF", left: "73%", top: "72%" },
];

const SUB_SLOTS: PlayerSlotKey[] = [
  "subOne",
  "subTwo",
  "subThree",
  "subFour",
];

function PlayerTile({
  player,
  position,
  compact,
}: {
  player: TotwPlayerDto | null;
  position?: string;
  compact?: boolean;
}) {
  const palette = teamColors(player?.team?.color);

  if (!player) {
    return (
      <div className="flex flex-col items-center gap-1 opacity-60">
        {position && (
          <span className="text-[9px] font-bold text-white/80 bg-black/30 rounded-full px-2 py-0.5">
            {position}
          </span>
        )}
        <div className="w-10 h-10 rounded-full border-2 border-dashed border-white/60 bg-black/20 flex items-center justify-center">
          <span className="text-white/70 text-sm">—</span>
        </div>
        <span className="text-[10px] text-white/70 font-semibold">Empty</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      {position && (
        <span className="text-[9px] font-bold text-white bg-black/40 rounded-full px-2 py-0.5">
          {position}
        </span>
      )}
      <Jersey
        primary={palette.primary}
        secondary={palette.secondary}
        badge={player.team?.teamName ?? ""}
        className={`${compact ? "w-10 sm:w-12" : "w-14 sm:w-16"} drop-shadow-md`}
      />
      <span
        className={`font-bold text-white text-center leading-tight ${
          compact ? "text-[10px]" : "text-[11px] sm:text-xs"
        }`}
      >
        {player.playerName}
      </span>
      {!compact && (
        <span className="text-[9px] font-semibold text-white/85 bg-black/30 rounded-full px-1.5">
          {player.team ? player.team.teamName : "Free agent"}
        </span>
      )}
    </div>
  );
}

export function TeamOfTheWeekPitch({
  teamOfTheWeek,
  compact,
}: {
  teamOfTheWeek: TeamOfTheWeekDto | null;
  compact?: boolean;
}) {
  if (!teamOfTheWeek) {
    return (
      <div className="w-full max-w-sm mx-auto bg-[#2e8b57] rounded-2xl px-6 py-10 text-center text-white/85 border-2 border-dashed border-white/40">
        <p className="font-bold">No Team of the Week selected yet.</p>
        <p className="text-sm mt-2">
          The selected players will line up here in a 2-1-2 shape once an admin picks them.
        </p>
      </div>
    );
  }

  return (
    <div className={compact ? "w-full max-w-xs mx-auto" : "w-full max-w-xl mx-auto"}>
      <div className="rounded-2xl bg-[#12351f] p-3 sm:p-4 shadow-lg">
        <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden">
          <svg
          viewBox="0 0 300 400"
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label="5-a-side pitch showing a 2-1-2 formation"
        >
          <defs>
            <linearGradient id="pitchGrass" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#2f8f54" />
              <stop offset="100%" stopColor="#21713f" />
            </linearGradient>
            <pattern id="pitchStripes" width="40" height="400" patternUnits="userSpaceOnUse">
              <rect width="20" height="400" fill="rgba(255,255,255,0.05)" />
            </pattern>
          </defs>

          <rect x="0" y="0" width="300" height="400" fill="#1b5e33" />
          <rect x="10" y="10" width="280" height="380" fill="url(#pitchGrass)" />
          <rect x="10" y="10" width="280" height="380" fill="url(#pitchStripes)" />
          <rect x="10" y="10" width="280" height="380" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" />

          <line x1="150" y1="10" x2="150" y2="390" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" />
          <circle cx="150" cy="200" r="32" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" />
          <circle cx="150" cy="200" r="2.5" fill="rgba(255,255,255,0.9)" />

          <rect x="70" y="10" width="160" height="58" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" />
          <rect x="70" y="332" width="160" height="58" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" />
          <rect x="105" y="10" width="90" height="26" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" />
          <rect x="105" y="364" width="90" height="26" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" />

          <rect x="118" y="2" width="64" height="8" rx="2" fill="rgba(255,255,255,0.85)" />
          <rect x="118" y="390" width="64" height="8" rx="2" fill="rgba(255,255,255,0.85)" />
        </svg>

        {STARTER_SLOTS.map((slot) => (
          <div
            key={slot.key}
            className="absolute"
            style={{ left: slot.left, top: slot.top, transform: "translate(-50%, -50%)" }}
          >
            <PlayerTile player={teamOfTheWeek[slot.key]} position={slot.position} compact={compact} />
          </div>
        ))}
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="h-px w-12 bg-white/60" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-white bg-[#4a7c59] rounded-full px-3 py-1">
            Substitutes
          </p>
          <span className="h-px w-12 bg-white/60" />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {SUB_SLOTS.map((slot) => (
            <div key={slot}>
              <PlayerTile player={teamOfTheWeek[slot]} position="SUB" compact={compact} />
            </div>
          ))}
        </div>
      </div>
    </div>
    </div>
  );
}