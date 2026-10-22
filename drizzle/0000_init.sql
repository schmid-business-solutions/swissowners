CREATE TABLE `auth_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`type` enum('verify','reset') NOT NULL,
	`token_hash` varchar(64) NOT NULL,
	`expires_at` datetime NOT NULL,
	`used_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `auth_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `auth_tokens_hash_uq` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `contact_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listing_id` int NOT NULL,
	`sender_id` int NOT NULL,
	`message` text NOT NULL,
	`nda_name` varchar(200) NOT NULL,
	`nda_accepted_at` datetime NOT NULL,
	`nda_ip` varchar(64),
	`read_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `contact_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `contact_listing_sender_uq` UNIQUE(`listing_id`,`sender_id`)
);
--> statement-breakpoint
CREATE TABLE `listings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`owner_id` int NOT NULL,
	`type` enum('sell','cap') NOT NULL,
	`segment` enum('kmu','startup') NOT NULL,
	`status` enum('draft','pending_payment','in_review','online','paused','expired','sold','rejected') NOT NULL DEFAULT 'draft',
	`plan` enum('start','basis','plus','premium') NOT NULL DEFAULT 'start',
	`title` varchar(80) NOT NULL,
	`description` text NOT NULL,
	`reason` text NOT NULL,
	`company_name` varchar(200) NOT NULL,
	`company_uid` varchar(20) NOT NULL,
	`branche` varchar(100) NOT NULL,
	`sub` varchar(100) NOT NULL,
	`kanton` varchar(60) NOT NULL,
	`region` varchar(40) NOT NULL,
	`legal_form` varchar(20) NOT NULL,
	`revenue_class` varchar(40) NOT NULL,
	`employees` int,
	`founded_year` int,
	`phase` varchar(40),
	`share_class` varchar(20),
	`stake` varchar(60),
	`amount` int,
	`valuation` int,
	`min_ticket` int,
	`vinkuliert` enum('ja','nein','unklar') NOT NULL,
	`vorkauf` enum('ja','nein','unklar') NOT NULL,
	`company_informed` boolean NOT NULL DEFAULT false,
	`views` int NOT NULL DEFAULT 0,
	`rejection_reason` text,
	`published_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `listings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reference` varchar(40) NOT NULL,
	`listing_id` int NOT NULL,
	`user_id` int NOT NULL,
	`kind` enum('initial','upgrade','renewal','reactivation') NOT NULL,
	`plan` enum('start','basis','plus','premium') NOT NULL,
	`amount_rappen` int NOT NULL,
	`status` enum('open','paid','failed','cancelled') NOT NULL DEFAULT 'open',
	`payrexx_gateway_id` int,
	`payrexx_tx_id` int,
	`paid_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `payments_reference_uq` UNIQUE(`reference`)
);
--> statement-breakpoint
CREATE TABLE `saved_listings` (
	`user_id` int NOT NULL,
	`listing_id` int NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `saved_listings_user_id_listing_id_pk` PRIMARY KEY(`user_id`,`listing_id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` varchar(64) NOT NULL,
	`user_id` int NOT NULL,
	`expires_at` datetime NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listing_id` int NOT NULL,
	`plan` enum('start','basis','plus','premium') NOT NULL,
	`status` enum('pending','active','paused','past_due','ended') NOT NULL DEFAULT 'pending',
	`period_end` datetime,
	`cancel_at_period_end` boolean NOT NULL DEFAULT false,
	`paused_at` datetime,
	`paused_remaining_days` int,
	`payrexx_token_tx_id` int,
	`reminded_for` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptions_listing_uq` UNIQUE(`listing_id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`first_name` varchar(100) NOT NULL,
	`last_name` varchar(100) NOT NULL,
	`phone` varchar(40),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`email_verified_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_uq` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `auth_tokens` ADD CONSTRAINT `auth_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contact_requests` ADD CONSTRAINT `contact_requests_listing_id_listings_id_fk` FOREIGN KEY (`listing_id`) REFERENCES `listings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contact_requests` ADD CONSTRAINT `contact_requests_sender_id_users_id_fk` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `listings` ADD CONSTRAINT `listings_owner_id_users_id_fk` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_listing_id_listings_id_fk` FOREIGN KEY (`listing_id`) REFERENCES `listings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `saved_listings` ADD CONSTRAINT `saved_listings_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `saved_listings` ADD CONSTRAINT `saved_listings_listing_id_listings_id_fk` FOREIGN KEY (`listing_id`) REFERENCES `listings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_listing_id_listings_id_fk` FOREIGN KEY (`listing_id`) REFERENCES `listings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `listings_status_idx` ON `listings` (`status`);--> statement-breakpoint
CREATE INDEX `listings_owner_idx` ON `listings` (`owner_id`);--> statement-breakpoint
CREATE INDEX `listings_branche_idx` ON `listings` (`branche`);--> statement-breakpoint
CREATE INDEX `payments_listing_idx` ON `payments` (`listing_id`);--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);