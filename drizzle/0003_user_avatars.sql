CREATE TABLE `user_avatars` (
	`user_id` int NOT NULL,
	`mime` varchar(40) NOT NULL,
	`data` mediumtext NOT NULL,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `user_avatars_user_id` PRIMARY KEY(`user_id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `avatar_updated_at` datetime;--> statement-breakpoint
ALTER TABLE `user_avatars` ADD CONSTRAINT `user_avatars_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;