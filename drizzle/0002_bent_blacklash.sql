PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_players_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`playerName` text NOT NULL,
	`goals` integer NOT NULL,
	`assists` integer NOT NULL,
	`yellowCard` integer NOT NULL,
	`redCard` integer NOT NULL,
	`teamId` integer NOT NULL,
	FOREIGN KEY (`teamId`) REFERENCES `teams_table`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_players_table`("id", "playerName", "goals", "assists", "yellowCard", "redCard", "teamId") SELECT "id", "playerName", "goals", "assists", "yellowCard", "redCard", "teamId" FROM `players_table`;--> statement-breakpoint
DROP TABLE `players_table`;--> statement-breakpoint
ALTER TABLE `__new_players_table` RENAME TO `players_table`;--> statement-breakpoint
PRAGMA foreign_keys=ON;