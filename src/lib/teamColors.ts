export interface TeamColors {
  primary: string;
  secondary: string;
}

// Team kit palettes keyed by the team `color` value stored in the database.
// Customize a team's jersey by editing the hex values here.
const PALETTES: Record<string, TeamColors> = {
  red: { primary: "#C62828", secondary: "#FBE9E7" },
  green: { primary: "#2E7D32", secondary: "#E8F5E9" },
  orange: { primary: "#E65100", secondary: "#FFF3E0" },
  blue: { primary: "#1565C0", secondary: "#E3F2FD" },
};

export const teamColors = (color?: string | null): TeamColors => {
  if (color && PALETTES[color.toLowerCase()]) {
    return PALETTES[color.toLowerCase()];
  }
  return { primary: "#6B7280", secondary: "#F3F4F6" };
};