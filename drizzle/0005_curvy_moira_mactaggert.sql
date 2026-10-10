CREATE TABLE "team_of_the_week_table" (
	"id" serial PRIMARY KEY NOT NULL,
	"competitionId" integer NOT NULL,
	"weekLabel" text,
	"defenderOneId" integer,
	"defenderTwoId" integer,
	"midfielderId" integer,
	"forwardOneId" integer,
	"forwardTwoId" integer,
	"subOneId" integer,
	"subTwoId" integer,
	"subThreeId" integer,
	"subFourId" integer,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_totw_per_competition" UNIQUE("competitionId")
);
--> statement-breakpoint
ALTER TABLE "team_of_the_week_table" ADD CONSTRAINT "team_of_the_week_table_competitionId_competitions_table_id_fk" FOREIGN KEY ("competitionId") REFERENCES "public"."competitions_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_of_the_week_table" ADD CONSTRAINT "team_of_the_week_table_defenderOneId_players_table_id_fk" FOREIGN KEY ("defenderOneId") REFERENCES "public"."players_table"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_of_the_week_table" ADD CONSTRAINT "team_of_the_week_table_defenderTwoId_players_table_id_fk" FOREIGN KEY ("defenderTwoId") REFERENCES "public"."players_table"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_of_the_week_table" ADD CONSTRAINT "team_of_the_week_table_midfielderId_players_table_id_fk" FOREIGN KEY ("midfielderId") REFERENCES "public"."players_table"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_of_the_week_table" ADD CONSTRAINT "team_of_the_week_table_forwardOneId_players_table_id_fk" FOREIGN KEY ("forwardOneId") REFERENCES "public"."players_table"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_of_the_week_table" ADD CONSTRAINT "team_of_the_week_table_forwardTwoId_players_table_id_fk" FOREIGN KEY ("forwardTwoId") REFERENCES "public"."players_table"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_of_the_week_table" ADD CONSTRAINT "team_of_the_week_table_subOneId_players_table_id_fk" FOREIGN KEY ("subOneId") REFERENCES "public"."players_table"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_of_the_week_table" ADD CONSTRAINT "team_of_the_week_table_subTwoId_players_table_id_fk" FOREIGN KEY ("subTwoId") REFERENCES "public"."players_table"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_of_the_week_table" ADD CONSTRAINT "team_of_the_week_table_subThreeId_players_table_id_fk" FOREIGN KEY ("subThreeId") REFERENCES "public"."players_table"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_of_the_week_table" ADD CONSTRAINT "team_of_the_week_table_subFourId_players_table_id_fk" FOREIGN KEY ("subFourId") REFERENCES "public"."players_table"("id") ON DELETE set null ON UPDATE no action;