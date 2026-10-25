CREATE TABLE `app_flags` (
	`key` varchar(60) NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `app_flags_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
INSERT INTO `app_flags` (`key`) VALUES ('ext_samples');