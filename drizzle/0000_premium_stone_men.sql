CREATE TABLE `votes` (
	`voter` text NOT NULL,
	`group_id` integer NOT NULL,
	`list_id` text NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`voter`, `group_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_votes_list` ON `votes` (`list_id`);