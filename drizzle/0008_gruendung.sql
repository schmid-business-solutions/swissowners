ALTER TABLE `orgs` MODIFY COLUMN `kind` enum('ma','nachfolge','treuhand','bewertung','recht','bank','foerderung','park','inkubator','vc','angels','gruendung') NOT NULL;
--> statement-breakpoint
INSERT INTO `app_flags` (`key`) VALUES ('gruendung_samples');