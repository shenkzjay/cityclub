ALTER TABLE "team_of_the_week_table" DROP CONSTRAINT "team_of_the_week_table_subOneId_players_table_id_fk";
--> statement-breakpoint
ALTER TABLE "team_of_the_week_table" DROP CONSTRAINT "team_of_the_week_table_subTwoId_players_table_id_fk";
--> statement-breakpoint
ALTER TABLE "team_of_the_week_table" DROP CONSTRAINT "team_of_the_week_table_subThreeId_players_table_id_fk";
--> statement-breakpoint
ALTER TABLE "team_of_the_week_table" DROP CONSTRAINT "team_of_the_week_table_subFourId_players_table_id_fk";
--> statement-breakpoint
ALTER TABLE "team_of_the_week_table" DROP COLUMN "subOneId";--> statement-breakpoint
ALTER TABLE "team_of_the_week_table" DROP COLUMN "subTwoId";--> statement-breakpoint
ALTER TABLE "team_of_the_week_table" DROP COLUMN "subThreeId";--> statement-breakpoint
ALTER TABLE "team_of_the_week_table" DROP COLUMN "subFourId";