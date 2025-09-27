CREATE TABLE `players_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`playerName` text NOT NULL,
	`goals` integer NOT NULL,
	`assists` integer NOT NULL,
	`yellowCard` integer NOT NULL,
	`redCard` integer NOT NULL,
	`teamId` integer NOT NULL,
	FOREIGN KEY (`teamId`) REFERENCES `teams_table`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `teams_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`teamName` text NOT NULL,
	`color` text NOT NULL,
	`description` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `users_table` ADD `username` text NOT NULL;--> statement-breakpoint
ALTER TABLE `users_table` ADD `password` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `email_idx` ON `users_table` (`email`);--> statement-breakpoint
ALTER TABLE `users_table` DROP COLUMN `name`;--> statement-breakpoint
ALTER TABLE `users_table` DROP COLUMN `age`;