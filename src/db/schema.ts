import { integer, pgTable as table, text, unique, uniqueIndex, serial } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const usersTable = table(
  "users_table",
  {
    id: serial("id").primaryKey(),
    username: text("username").notNull(),
    email: text("email").notNull().unique(),
    password: text("password").notNull(),
  },
  (table) => [uniqueIndex("email_idx").on(table.email)]
);

export const pointsTable = table("points_table", {
  id: serial("id").primaryKey(),
  gamesPlayed: integer("gamesPlayed").notNull().default(0),
  gamesPoint: integer("gamesPoint").notNull().default(0),
  goalsFor: integer("goalFor").notNull().default(0),
  goalsAgainst: integer("goalAgainst").notNull().default(0),
  goalDifference: integer("goalDifference").notNull().default(0),
  gamesWon: integer("gamesWon").notNull().default(0),
  gamesLost: integer("gamesLost").notNull().default(0),
  gamesDrawn: integer("gamesDrawn").notNull().default(0),
  points: integer("points").notNull().default(0),
  teamId: integer("teamId")
    .unique()
    .references(() => teamsTable.id, { onDelete: "cascade" })
    .notNull(),
});

export const matchTable = table("match_table", {
  id: serial("id").primaryKey(),
  homeTeamId: integer("homeTeamId").references(() => teamsTable.id, { onDelete: "cascade" }),
  awayTeamId: integer("awayTeamId").references(() => teamsTable.id, { onDelete: "cascade" }),
  homeGoals: integer("homeGoals").notNull().default(0),
  awayGoals: integer("awayGoals").notNull().default(0),
  matchDate: text("matchDate").notNull(),
});

export const teamsTable = table(
  "teams_table",
  {
    id: serial("id").primaryKey(),
    teamName: text("teamName").notNull(),
    color: text("color").notNull(),
    description: text("description").notNull(),
  },
  (table) => [unique("unique_team_name").on(table.teamName)]
);

export const playersTable = table(
  "players_table",
  {
    id: serial("id").primaryKey(),
    playerName: text("playerName").notNull(),
    goals: integer("goals").notNull().default(0),
    assists: integer("assists").notNull().default(0),
    yellowCard: integer("yellowCard").notNull().default(0),
    redCard: integer("redCard").notNull().default(0),
    teamId: integer("teamId").references(() => teamsTable.id, { onDelete: "cascade" }),
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
