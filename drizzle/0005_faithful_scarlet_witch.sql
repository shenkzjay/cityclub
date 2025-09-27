CREATE TABLE `match_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`homeTeamId` integer,
	`awayTeamId` integer,
	`homeGoals` integer DEFAULT 0 NOT NULL,
	`awayGoals` integer DEFAULT 0 NOT NULL,
	`matchDate` text NOT NULL,
	FOREIGN KEY (`homeTeamId`) REFERENCES `teams_table`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`awayTeamId`) REFERENCES `teams_table`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `points_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`gamesPlayed` integer DEFAULT 0 NOT NULL,
	`gamesPoint` integer DEFAULT 0 NOT NULL,
	`goalFor` integer DEFAULT 0 NOT NULL,
	`goalAgainst` integer DEFAULT 0 NOT NULL,
	`goalDifference` integer DEFAULT 0 NOT NULL,
	`gamesWon` integer DEFAULT 0 NOT NULL,
	`gamesLost` integer DEFAULT 0 NOT NULL,
	`gamesDrawn` integer DEFAULT 0 NOT NULL,
	`points` integer DEFAULT 0 NOT NULL,
	`teamId` integer NOT NULL,
	FOREIGN KEY (`teamId`) REFERENCES `teams_table`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `points_table_teamId_unique` ON `points_table` (`teamId`);