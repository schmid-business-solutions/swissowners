CREATE TABLE `contact_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`topic` varchar(30) NOT NULL,
	`name` varchar(160) NOT NULL,
	`email` varchar(255) NOT NULL,
	`phone` varchar(40),
	`company` varchar(160),
	`subject` varchar(200) NOT NULL,
	`message` text NOT NULL,
	`details` text,
	`user_id` int,
	`ip` varchar(64),
	`status` enum('new','done') NOT NULL DEFAULT 'new',
	`done_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `contact_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `contact_messages` ADD CONSTRAINT `contact_messages_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `contact_status_idx` ON `contact_messages` (`status`,`created_at`);