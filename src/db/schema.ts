import { int, sqliteTable as table, text, unique, uniqueIndex } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const usersTable = table(
  "users_table",
  {
    id: int("id").primaryKey({ autoIncrement: true }),
    username: text("username").notNull(),
    email: text("email").notNull().unique(),
    password: text("password").notNull(),
  },
  (table) => [uniqueIndex("email_idx").on(table.email)]
);

export const pointsTable = table("points_table", {
  id: int().primaryKey({ autoIncrement: true }),
  gamesPlayed: int("gamesPlayed").notNull().default(0),
  gamesPoint: int("gamesPoint").notNull().default(0),
  goalsFor: int("goalFor").notNull().default(0),
  goalsAgainst: int("goalAgainst").notNull().default(0),
  goalDifference: int("goalDifference").notNull().default(0),
  gamesWon: int("gamesWon").notNull().default(0),
  gamesLost: int("gamesLost").notNull().default(0),
  gamesDrawn: int("gamesDrawn").notNull().default(0),
  points: int("points").notNull().default(0),
  teamId: int("teamId")
    .unique()
    .references(() => teamsTable.id, { onDelete: "cascade" })
    .notNull(),
});

export const matchTable = table("match_table", {
  id: int("id").primaryKey({ autoIncrement: true }),
  homeTeamId: int("homeTeamId").references(() => teamsTable.id, { onDelete: "cascade" }),
  awayTeamId: int("awayTeamId").references(() => teamsTable.id, { onDelete: "cascade" }),
  homeGoals: int("homeGoals").notNull().default(0),
  awayGoals: int("awayGoals").notNull().default(0),
  matchDate: text("matchDate").notNull(),
});

export const teamsTable = table(
  "teams_table",
  {
    id: int("id").primaryKey({ autoIncrement: true }),
    teamName: text("teamName").notNull(),
    color: text("color").notNull(),
    description: text("description").notNull(),
  },
  (table) => [unique("unique_team_name").on(table.teamName)]
);

export const playersTable = table(
  "players_table",
  {
    id: int("id").primaryKey({ autoIncrement: true }),
    playerName: text("playerName").notNull(),
    goals: int("goals").notNull().default(0),
    assists: int("assists").notNull().default(0),
    yellowCard: int("yellowCard").notNull().default(0),
    redCard: int("redCard").notNull().default(0),
    teamId: int("teamId").references(() => teamsTable.id, { onDelete: "cascade" }),
  },
  (table) => [unique("unique_player_name").on(table.playerName)]
);

//one team could have many players (one - many)
export const teamRelations = relations(teamsTable, ({ many, one }) => ({
  players: many(playersTable),
  score: one(pointsTable, {
    fields: [teamsTable.id],
    references: [pointsTable.teamId],
  }),
}));

//many teams could only have one player (many - one)
export const playerRelations = relations(playersTable, ({ one }) => ({
  team: one(teamsTable, {
    fields: [playersTable.teamId],
    references: [teamsTable.id],
  }),
}));
