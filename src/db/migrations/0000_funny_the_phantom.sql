CREATE TABLE `users` (
	`id` varchar(36) PRIMARY KEY NOT NULL,
	`email` varchar(191) NOT NULL,
	`emailVerified` timestamp,
	`image` varchar(191),
	`created_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users__email__idx` ON `users` (`email`);