PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_players_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`playerName` text NOT NULL,
	`goals` integer DEFAULT 0 NOT NULL,
	`assists` integer DEFAULT 0 NOT NULL,
	`yellowCard` integer DEFAULT 0 NOT NULL,
	`redCard` integer DEFAULT 0 NOT NULL,
	`teamId` integer,
	FOREIGN KEY (`teamId`) REFERENCES `teams_table`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_players_table`("id", "playerName", "goals", "assists", "yellowCard", "redCard", "teamId") SELECT "id", "playerName", "goals", "assists", "yellowCard", "redCard", "teamId" FROM `players_table`;--> statement-breakpoint
DROP TABLE `players_table`;--> statement-breakpoint
ALTER TABLE `__new_players_table` RENAME TO `players_table`;--> statement-breakpoint
PRAGMA foreign_keys=ON;