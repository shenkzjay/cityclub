CREATE TABLE "match_table" (
	"id" serial PRIMARY KEY NOT NULL,
	"homeTeamId" integer,
	"awayTeamId" integer,
	"homeGoals" integer DEFAULT 0 NOT NULL,
	"awayGoals" integer DEFAULT 0 NOT NULL,
	"matchDate" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players_table" (
	"id" serial PRIMARY KEY NOT NULL,
	"playerName" text NOT NULL,
	"goals" integer DEFAULT 0 NOT NULL,
	"assists" integer DEFAULT 0 NOT NULL,
	"yellowCard" integer DEFAULT 0 NOT NULL,
	"redCard" integer DEFAULT 0 NOT NULL,
	"teamId" integer,
	CONSTRAINT "unique_player_name" UNIQUE("playerName")
);
--> statement-breakpoint
CREATE TABLE "points_table" (
	"id" serial PRIMARY KEY NOT NULL,
	"gamesPlayed" integer DEFAULT 0 NOT NULL,
	"gamesPoint" integer DEFAULT 0 NOT NULL,
	"goalFor" integer DEFAULT 0 NOT NULL,
	"goalAgainst" integer DEFAULT 0 NOT NULL,
	"goalDifference" integer DEFAULT 0 NOT NULL,
	"gamesWon" integer DEFAULT 0 NOT NULL,
	"gamesLost" integer DEFAULT 0 NOT NULL,
	"gamesDrawn" integer DEFAULT 0 NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"teamId" integer NOT NULL,
	CONSTRAINT "points_table_teamId_unique" UNIQUE("teamId")
);
--> statement-breakpoint
CREATE TABLE "teams_table" (
	"id" serial PRIMARY KEY NOT NULL,
	"teamName" text NOT NULL,
	"color" text NOT NULL,
	"description" text NOT NULL,
	CONSTRAINT "unique_team_name" UNIQUE("teamName")
);
--> statement-breakpoint
CREATE TABLE "users_table" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_table_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "match_table" ADD CONSTRAINT "match_table_homeTeamId_teams_table_id_fk" FOREIGN KEY ("homeTeamId") REFERENCES "public"."teams_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_table" ADD CONSTRAINT "match_table_awayTeamId_teams_table_id_fk" FOREIGN KEY ("awayTeamId") REFERENCES "public"."teams_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players_table" ADD CONSTRAINT "players_table_teamId_teams_table_id_fk" FOREIGN KEY ("teamId") REFERENCES "public"."teams_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_table" ADD CONSTRAINT "points_table_teamId_teams_table_id_fk" FOREIGN KEY ("teamId") REFERENCES "public"."teams_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "email_idx" ON "users_table" USING btree ("email");