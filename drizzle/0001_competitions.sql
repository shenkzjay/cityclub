CREATE TABLE "competitions_table" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Seed a competition to own any data that already exists so nothing is lost.
INSERT INTO "competitions_table" ("name", "status")
SELECT 'City Club League Championship 2025', 'active'
WHERE NOT EXISTS (SELECT 1 FROM "competitions_table");
--> statement-breakpoint
-- Add references as nullable first so existing rows are not rejected.
ALTER TABLE "match_table" ADD COLUMN "competitionId" integer;
--> statement-breakpoint
ALTER TABLE "players_table" ADD COLUMN "competitionId" integer;
--> statement-breakpoint
ALTER TABLE "points_table" ADD COLUMN "competitionId" integer;
--> statement-breakpoint
ALTER TABLE "teams_table" ADD COLUMN "competitionId" integer;
--> statement-breakpoint
-- Backfill every existing row with the seeded competition.
UPDATE "teams_table" SET "competitionId" = (SELECT "id" FROM "competitions_table" ORDER BY "id" LIMIT 1) WHERE "competitionId" IS NULL;
--> statement-breakpoint
UPDATE "players_table" SET "competitionId" = (SELECT "id" FROM "competitions_table" ORDER BY "id" LIMIT 1) WHERE "competitionId" IS NULL;
--> statement-breakpoint
UPDATE "points_table" SET "competitionId" = (SELECT "id" FROM "competitions_table" ORDER BY "id" LIMIT 1) WHERE "competitionId" IS NULL;
--> statement-breakpoint
UPDATE "match_table" SET "competitionId" = (SELECT "id" FROM "competitions_table" ORDER BY "id" LIMIT 1) WHERE "competitionId" IS NULL;
--> statement-breakpoint
-- Now that all rows are populated, enforce NOT NULL.
ALTER TABLE "players_table" ALTER COLUMN "competitionId" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "points_table" ALTER COLUMN "competitionId" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "teams_table" ALTER COLUMN "competitionId" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "match_table" ADD CONSTRAINT "match_table_competitionId_competitions_table_id_fk" FOREIGN KEY ("competitionId") REFERENCES "public"."competitions_table"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "players_table" ADD CONSTRAINT "players_table_competitionId_competitions_table_id_fk" FOREIGN KEY ("competitionId") REFERENCES "public"."competitions_table"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "points_table" ADD CONSTRAINT "points_table_competitionId_competitions_table_id_fk" FOREIGN KEY ("competitionId") REFERENCES "public"."competitions_table"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "teams_table" ADD CONSTRAINT "teams_table_competitionId_competitions_table_id_fk" FOREIGN KEY ("competitionId") REFERENCES "public"."competitions_table"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
-- Replace global unique constraints with per-competition ones.
ALTER TABLE "players_table" DROP CONSTRAINT "unique_player_name";
--> statement-breakpoint
ALTER TABLE "points_table" DROP CONSTRAINT "points_table_teamId_unique";
--> statement-breakpoint
ALTER TABLE "teams_table" DROP CONSTRAINT "unique_team_name";
--> statement-breakpoint
ALTER TABLE "players_table" ADD CONSTRAINT "unique_player_name_per_competition" UNIQUE("playerName","competitionId");
--> statement-breakpoint
ALTER TABLE "points_table" ADD CONSTRAINT "unique_team_points_per_competition" UNIQUE("teamId","competitionId");
--> statement-breakpoint
ALTER TABLE "teams_table" ADD CONSTRAINT "unique_team_name_per_competition" UNIQUE("teamName","competitionId");
