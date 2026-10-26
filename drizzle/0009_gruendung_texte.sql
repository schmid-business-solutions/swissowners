UPDATE `orgs` SET `services` = REPLACE(`services`, 'Firmengründung (AG, GmbH)', 'Firmengründung') WHERE `services` LIKE '%Firmengründung (AG, GmbH)%';
--> statement-breakpoint
INSERT IGNORE INTO `app_flags` (`key`) VALUES ('gruendung_samples');
