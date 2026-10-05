CREATE TABLE `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`order_id` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `payment_records` (
	`order_id` text PRIMARY KEY NOT NULL,
	`bank_tran_id` text NOT NULL,
	`risk` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `service_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`kind` text NOT NULL,
	`state` text NOT NULL,
	`payload` text DEFAULT '{}' NOT NULL,
	`provider_ref` text DEFAULT '' NOT NULL,
	`detail` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_service_order` ON `service_jobs` (`order_id`);