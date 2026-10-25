CREATE TABLE `board_mandates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`owner_id` int NOT NULL,
	`org_id` int,
	`role` enum('praesidium','mitglied','delegiert','beirat') NOT NULL,
	`title` varchar(100) NOT NULL,
	`segment` enum('kmu','startup') NOT NULL,
	`branche` varchar(100) NOT NULL,
	`kanton` varchar(60) NOT NULL,
	`region` varchar(40) NOT NULL,
	`company_name` varchar(200) NOT NULL,
	`company_uid` varchar(20) NOT NULL,
	`revenue_class` varchar(40),
	`employees` int,
	`phase` varchar(40),
	`skills` varchar(600) NOT NULL,
	`description` text NOT NULL,
	`effort` varchar(160) NOT NULL,
	`fee` varchar(160) NOT NULL,
	`requirements` text,
	`languages` varchar(120) NOT NULL,
	`start_at` varchar(80) NOT NULL,
	`invest_welcome` boolean NOT NULL DEFAULT false,
	`status` enum('in_review','online','paused','expired','rejected') NOT NULL DEFAULT 'in_review',
	`is_sample` boolean NOT NULL DEFAULT false,
	`rejection_reason` text,
	`views` int NOT NULL DEFAULT 0,
	`published_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `board_mandates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `board_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`display_name` varchar(160) NOT NULL,
	`headline` varchar(160) NOT NULL,
	`bio` text NOT NULL,
	`experience` text NOT NULL,
	`mandates` text,
	`skills` varchar(600) NOT NULL,
	`branchen` varchar(800) NOT NULL DEFAULT '',
	`languages` varchar(120) NOT NULL,
	`kanton` varchar(60) NOT NULL,
	`region` varchar(40) NOT NULL,
	`capacity` varchar(60) NOT NULL,
	`fee` varchar(120),
	`investor` boolean NOT NULL DEFAULT false,
	`ticket` varchar(120),
	`linkedin` varchar(200),
	`visibility` enum('public','members','anonymous') NOT NULL DEFAULT 'members',
	`status` enum('in_review','online','paused','expired','rejected') NOT NULL DEFAULT 'in_review',
	`is_sample` boolean NOT NULL DEFAULT false,
	`rejection_reason` text,
	`views` int NOT NULL DEFAULT 0,
	`published_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `board_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inquiries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`kind` enum('mandate','profile','org') NOT NULL,
	`target_id` int NOT NULL,
	`sender_id` int NOT NULL,
	`message` text NOT NULL,
	`nda_accepted_at` datetime,
	`read_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `inquiries_id` PRIMARY KEY(`id`),
	CONSTRAINT `inquiries_target_sender_uq` UNIQUE(`kind`,`target_id`,`sender_id`)
);
--> statement-breakpoint
CREATE TABLE `org_members` (
	`org_id` int NOT NULL,
	`user_id` int NOT NULL,
	`role` enum('admin','member') NOT NULL DEFAULT 'member',
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `org_members_org_id_user_id_pk` PRIMARY KEY(`org_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `orgs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(90) NOT NULL,
	`kind` enum('ma','nachfolge','treuhand','bewertung','recht','bank','foerderung','park','inkubator','vc','angels') NOT NULL,
	`name` varchar(160) NOT NULL,
	`uid` varchar(20),
	`tagline` varchar(160) NOT NULL,
	`description` text NOT NULL,
	`services` varchar(600) NOT NULL DEFAULT '',
	`branchen` varchar(800) NOT NULL DEFAULT '',
	`focus` varchar(200),
	`kanton` varchar(60) NOT NULL,
	`region` varchar(40) NOT NULL,
	`city` varchar(80) NOT NULL,
	`languages` varchar(120) NOT NULL DEFAULT 'Deutsch',
	`website` varchar(200),
	`email` varchar(200) NOT NULL,
	`phone` varchar(40),
	`status` enum('in_review','online','paused','expired','rejected') NOT NULL DEFAULT 'in_review',
	`verified` boolean NOT NULL DEFAULT false,
	`is_sample` boolean NOT NULL DEFAULT false,
	`rejection_reason` text,
	`created_by` int,
	`published_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `orgs_id` PRIMARY KEY(`id`),
	CONSTRAINT `orgs_slug_uq` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `listings` ADD `org_id` int;--> statement-breakpoint
ALTER TABLE `listings` ADD `mandate_confirmed` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `board_mandates` ADD CONSTRAINT `board_mandates_owner_id_users_id_fk` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `board_mandates` ADD CONSTRAINT `board_mandates_org_id_orgs_id_fk` FOREIGN KEY (`org_id`) REFERENCES `orgs`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `board_profiles` ADD CONSTRAINT `board_profiles_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inquiries` ADD CONSTRAINT `inquiries_sender_id_users_id_fk` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `org_members` ADD CONSTRAINT `org_members_org_id_orgs_id_fk` FOREIGN KEY (`org_id`) REFERENCES `orgs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `org_members` ADD CONSTRAINT `org_members_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `board_mandates_status_idx` ON `board_mandates` (`status`);--> statement-breakpoint
CREATE INDEX `board_mandates_owner_idx` ON `board_mandates` (`owner_id`);--> statement-breakpoint
CREATE INDEX `board_profiles_user_idx` ON `board_profiles` (`user_id`);--> statement-breakpoint
CREATE INDEX `board_profiles_status_idx` ON `board_profiles` (`status`);--> statement-breakpoint
CREATE INDEX `inquiries_target_idx` ON `inquiries` (`kind`,`target_id`);--> statement-breakpoint
CREATE INDEX `org_members_user_idx` ON `org_members` (`user_id`);--> statement-breakpoint
CREATE INDEX `orgs_status_idx` ON `orgs` (`status`);--> statement-breakpoint
ALTER TABLE `listings` ADD CONSTRAINT `listings_org_id_orgs_id_fk` FOREIGN KEY (`org_id`) REFERENCES `orgs`(`id`) ON DELETE set null ON UPDATE no action;