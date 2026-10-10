CREATE TABLE "prediction_entries_table" (
	"id" serial PRIMARY KEY NOT NULL,
	"matchId" integer NOT NULL,
	"playerId" integer,
	"playerName" text NOT NULL,
	"guessedHomeGoals" integer NOT NULL,
	"guessedAwayGoals" integer NOT NULL,
	"eligible" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"prizeClaimed" boolean DEFAULT false NOT NULL,
	"submittedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_prediction_per_participant_per_match" UNIQUE("matchId","playerId"),
	CONSTRAINT "unique_prediction_per_name_per_match" UNIQUE("matchId","playerName")
);
--> statement-breakpoint
ALTER TABLE "match_table" ALTER COLUMN "homeGoals" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "match_table" ALTER COLUMN "homeGoals" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "match_table" ALTER COLUMN "awayGoals" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "match_table" ALTER COLUMN "awayGoals" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "match_table" ADD COLUMN "round" integer;--> statement-breakpoint
ALTER TABLE "match_table" ADD COLUMN "kickoffAt" timestamp;--> statement-breakpoint
ALTER TABLE "match_table" ADD COLUMN "status" text DEFAULT 'scheduled' NOT NULL;--> statement-breakpoint
ALTER TABLE "match_table" ADD COLUMN "prizeLabel" text DEFAULT '₦2,000 airtime' NOT NULL;--> statement-breakpoint
ALTER TABLE "prediction_entries_table" ADD CONSTRAINT "prediction_entries_table_matchId_match_table_id_fk" FOREIGN KEY ("matchId") REFERENCES "public"."match_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prediction_entries_table" ADD CONSTRAINT "prediction_entries_table_playerId_players_table_id_fk" FOREIGN KEY ("playerId") REFERENCES "public"."players_table"("id") ON DELETE set null ON UPDATE no action;