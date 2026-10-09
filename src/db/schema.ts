import {
  integer,
  pgTable as table,
  text,
  unique,
  uniqueIndex,
  serial,
  timestamp,
} from "drizzle-orm/pg-core";
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

export const competitionsTable = table("competitions_table", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const pointsTable = table(
  "points_table",
  {
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
      .references(() => teamsTable.id, { onDelete: "cascade" })
      .notNull(),
    competitionId: integer("competitionId")
      .references(() => competitionsTable.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [unique("unique_team_points_per_competition").on(table.teamId, table.competitionId)]
);

export const matchTable = table("match_table", {
  id: serial("id").primaryKey(),
  homeTeamId: integer("homeTeamId").references(() => teamsTable.id, { onDelete: "cascade" }),
  awayTeamId: integer("awayTeamId").references(() => teamsTable.id, { onDelete: "cascade" }),
  homeGoals: integer("homeGoals").notNull().default(0),
  awayGoals: integer("awayGoals").notNull().default(0),
  matchDate: text("matchDate").notNull(),
  competitionId: integer("competitionId").references(() => competitionsTable.id, {
    onDelete: "cascade",
  }),
});

export const teamsTable = table(
  "teams_table",
  {
    id: serial("id").primaryKey(),
    teamName: text("teamName").notNull(),
    color: text("color").notNull(),
    description: text("description").notNull(),
    competitionId: integer("competitionId")
      .references(() => competitionsTable.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [unique("unique_team_name_per_competition").on(table.teamName, table.competitionId)]
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
    competitionId: integer("competitionId")
      .references(() => competitionsTable.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [
    unique("unique_player_name_per_competition").on(table.playerName, table.competitionId),
  ]
);

//one competition could have many teams, players and matches (one - many)
export const competitionRelations = relations(competitionsTable, ({ many }) => ({
  teams: many(teamsTable),
  players: many(playersTable),
  matches: many(matchTable),
}));

//one team could have many players (one - many)
export const teamRelations = relations(teamsTable, ({ many, one }) => ({
  players: many(playersTable),
  score: one(pointsTable, {
    fields: [teamsTable.id],
    references: [pointsTable.teamId],
  }),
  competition: one(competitionsTable, {
    fields: [teamsTable.competitionId],
    references: [competitionsTable.id],
  }),
}));

//many teams could only have one player (many - one)
export const playerRelations = relations(playersTable, ({ one }) => ({
  team: one(teamsTable, {
    fields: [playersTable.teamId],
    references: [teamsTable.id],
  }),
  competition: one(competitionsTable, {
    fields: [playersTable.competitionId],
    references: [competitionsTable.id],
  }),
}));

//a match belongs to one competition (many - one)
export const matchRelations = relations(matchTable, ({ one }) => ({
  competition: one(competitionsTable, {
    fields: [matchTable.competitionId],
    references: [competitionsTable.id],
  }),
  homeTeam: one(teamsTable, {
    fields: [matchTable.homeTeamId],
    references: [teamsTable.id],
    relationName: "homeTeamMatches",
  }),
  awayTeam: one(teamsTable, {
    fields: [matchTable.awayTeamId],
    references: [teamsTable.id],
    relationName: "awayTeamMatches",
  }),
}));
