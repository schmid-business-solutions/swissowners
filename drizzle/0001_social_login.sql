CREATE TABLE `oauth_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`provider` enum('google','linkedin') NOT NULL,
	`provider_user_id` varchar(255) NOT NULL,
	`email` varchar(255),
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `oauth_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `oauth_provider_user_uq` UNIQUE(`provider`,`provider_user_id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `password_hash` varchar(255);--> statement-breakpoint
ALTER TABLE `oauth_accounts` ADD CONSTRAINT `oauth_accounts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `oauth_user_idx` ON `oauth_accounts` (`user_id`);