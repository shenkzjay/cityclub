import {
  integer,
  pgTable as table,
  text,
  unique,
  uniqueIndex,
  serial,
  timestamp,
  boolean,
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

export const newsTable = table(
  "news_table",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    date: text("date").notNull(),
    coverImage: text("coverImage"),
    content: text("content").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("news_slug_idx").on(table.slug)]
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
  homeGoals: integer("homeGoals"),
  awayGoals: integer("awayGoals"),
  matchDate: text("matchDate").notNull(),
  competitionId: integer("competitionId").references(() => competitionsTable.id, {
    onDelete: "cascade",
  }),
  round: integer("round"),
  kickoffAt: timestamp("kickoffAt"),
  status: text("status").notNull().default("scheduled"),
  prizeLabel: text("prizeLabel").notNull().default("₦2,000 airtime"),
  pointsRecorded: boolean("pointsRecorded").notNull().default(false),
  roastNote: text("roastNote"),
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
    isCaptain: boolean("isCaptain").notNull().default(false),
    teamId: integer("teamId").references(() => teamsTable.id, { onDelete: "cascade" }),
    competitionId: integer("competitionId")
      .references(() => competitionsTable.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [
    unique("unique_player_name_per_competition").on(table.playerName, table.competitionId),
  ]
);

export const predictionEntriesTable = table(
  "prediction_entries_table",
  {
    id: serial("id").primaryKey(),
    matchId: integer("matchId")
      .references(() => matchTable.id, { onDelete: "cascade" })
      .notNull(),
    playerId: integer("playerId").references(() => playersTable.id, { onDelete: "set null" }),
    playerName: text("playerName").notNull(),
    guessedHomeGoals: integer("guessedHomeGoals").notNull(),
    guessedAwayGoals: integer("guessedAwayGoals").notNull(),
    eligible: boolean("eligible").notNull().default(false),
    status: text("status").notNull().default("open"),
    prizeClaimed: boolean("prizeClaimed").notNull().default(false),
    submittedAt: timestamp("submittedAt").notNull().defaultNow(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => [
    unique("unique_prediction_per_participant_per_match").on(table.matchId, table.playerId),
    unique("unique_prediction_per_name_per_match").on(table.matchId, table.playerName),
  ]
);

//one competition could have many teams, players and matches (one - many)
export const competitionRelations = relations(competitionsTable, ({ many, one }) => ({
  teams: many(teamsTable),
  players: many(playersTable),
  matches: many(matchTable),
  teamOfTheWeek: one(teamOfTheWeekTable, {
    fields: [competitionsTable.id],
    references: [teamOfTheWeekTable.competitionId],
  }),
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
export const playerRelations = relations(playersTable, ({ one, many }) => ({
  team: one(teamsTable, {
    fields: [playersTable.teamId],
    references: [teamsTable.id],
  }),
  competition: one(competitionsTable, {
    fields: [playersTable.competitionId],
    references: [competitionsTable.id],
  }),
  predictions: many(predictionEntriesTable),
}));

//a match belongs to one competition (many - one)
export const matchRelations = relations(matchTable, ({ one, many }) => ({
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
  predictions: many(predictionEntriesTable),
}));

export const predictionEntryRelations = relations(predictionEntriesTable, ({ one }) => ({
  match: one(matchTable, {
    fields: [predictionEntriesTable.matchId],
    references: [matchTable.id],
  }),
  player: one(playersTable, {
    fields: [predictionEntriesTable.playerId],
    references: [playersTable.id],
  }),
}));

export const teamOfTheWeekTable = table(
  "team_of_the_week_table",
  {
    id: serial("id").primaryKey(),
    competitionId: integer("competitionId")
      .references(() => competitionsTable.id, { onDelete: "cascade" })
      .notNull(),
    weekLabel: text("weekLabel"),
    defenderOneId: integer("defenderOneId").references(() => playersTable.id, {
      onDelete: "set null",
    }),
    defenderTwoId: integer("defenderTwoId").references(() => playersTable.id, {
      onDelete: "set null",
    }),
    midfielderId: integer("midfielderId").references(() => playersTable.id, {
      onDelete: "set null",
    }),
    forwardOneId: integer("forwardOneId").references(() => playersTable.id, {
      onDelete: "set null",
    }),
    forwardTwoId: integer("forwardTwoId").references(() => playersTable.id, {
      onDelete: "set null",
    }),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => [unique("unique_totw_per_competition").on(table.competitionId)]
);

export const teamOfTheWeekRelations = relations(teamOfTheWeekTable, ({ one }) => ({
  competition: one(competitionsTable, {
    fields: [teamOfTheWeekTable.competitionId],
    references: [competitionsTable.id],
  }),
  defenderOne: one(playersTable, {
    fields: [teamOfTheWeekTable.defenderOneId],
    references: [playersTable.id],
    relationName: "totwDefenderOne",
  }),
  defenderTwo: one(playersTable, {
    fields: [teamOfTheWeekTable.defenderTwoId],
    references: [playersTable.id],
    relationName: "totwDefenderTwo",
  }),
  midfielder: one(playersTable, {
    fields: [teamOfTheWeekTable.midfielderId],
    references: [playersTable.id],
    relationName: "totwMidfielder",
  }),
  forwardOne: one(playersTable, {
    fields: [teamOfTheWeekTable.forwardOneId],
    references: [playersTable.id],
    relationName: "totwForwardOne",
  }),
  forwardTwo: one(playersTable, {
    fields: [teamOfTheWeekTable.forwardTwoId],
    references: [playersTable.id],
    relationName: "totwForwardTwo",
  }),
}));
