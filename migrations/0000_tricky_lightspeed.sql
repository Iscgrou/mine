CREATE TABLE `backups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`file_name` text NOT NULL,
	`file_size` integer,
	`backup_type` text DEFAULT 'manual',
	`google_drive_file_id` text,
	`status` text DEFAULT 'completed',
	`created_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `collaborator_payouts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`collaborator_id` integer NOT NULL,
	`payout_amount` real NOT NULL,
	`payout_date` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`admin_user_id` integer,
	`payment_method` text,
	`notes` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `collaborators` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`collaborator_name` text NOT NULL,
	`unique_collaborator_id` text NOT NULL,
	`phone_number` text,
	`telegram_id` text,
	`email` text,
	`bank_account_details` text,
	`current_accumulated_earnings` real DEFAULT 0,
	`total_earnings_to_date` real DEFAULT 0,
	`total_payouts_to_date` real DEFAULT 0,
	`status` text DEFAULT 'active',
	`commission_percentage` real DEFAULT 10,
	`date_joined` integer DEFAULT CURRENT_TIMESTAMP,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `collaborators_unique_collaborator_id_unique` ON `collaborators` (`unique_collaborator_id`);--> statement-breakpoint
CREATE TABLE `commission_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`collaborator_id` integer NOT NULL,
	`representative_id` integer NOT NULL,
	`invoice_id` integer,
	`batch_id` integer,
	`transaction_date` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`revenue_type` text NOT NULL,
	`base_revenue_amount` real NOT NULL,
	`commission_rate` real NOT NULL,
	`commission_amount` real NOT NULL,
	`calculation_method` text DEFAULT 'automatic',
	`created_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `crm_ai_processing_queue` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`task_type` text NOT NULL,
	`input_data` text NOT NULL,
	`status` text DEFAULT 'pending',
	`result` text,
	`error_message` text,
	`related_entity_type` text,
	`related_entity_id` integer,
	`processing_started_at` integer,
	`processing_completed_at` integer,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `crm_call_preparations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`representative_id` integer NOT NULL,
	`crm_user_id` integer NOT NULL,
	`call_purpose` text NOT NULL,
	`ai_talking_points` text,
	`representative_background` text,
	`last_interaction_summary` text,
	`suggested_approach` text,
	`risk_factors` text,
	`opportunities` text,
	`cultural_notes` text,
	`emotional_state` text,
	`optimal_timing` text,
	`expected_outcome` text,
	`actual_call_interaction_id` integer,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `crm_interaction_types` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`color` text DEFAULT '#6B7280',
	`is_active` integer DEFAULT 1,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `crm_interaction_types_name_unique` ON `crm_interaction_types` (`name`);--> statement-breakpoint
CREATE TABLE `crm_interactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`representative_id` integer NOT NULL,
	`crm_user_id` integer NOT NULL,
	`interaction_type_id` integer NOT NULL,
	`direction` text NOT NULL,
	`subject` text,
	`summary` text,
	`manual_notes` text,
	`outcome` text,
	`sentiment_score` real,
	`sentiment_analysis` text,
	`urgency_level` text DEFAULT 'medium',
	`duration` integer,
	`follow_up_date` integer,
	`ai_suggestions` text,
	`voice_note_url` text,
	`transcription` text,
	`key_topics` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `crm_knowledge_base` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`category` text NOT NULL,
	`tags` text,
	`is_active` integer DEFAULT 1,
	`last_updated` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `crm_representative_profiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`representative_id` integer NOT NULL,
	`communication_preference` text,
	`best_contact_time` text,
	`language_preference` text DEFAULT 'persian',
	`personality_notes` text,
	`ai_personality_profile` text,
	`last_contact_attempt` integer,
	`next_scheduled_contact` integer,
	`total_interactions` integer DEFAULT 0,
	`average_sentiment` real,
	`lifetime_value` real,
	`risk_score` real,
	`opportunity_score` real,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `crm_representative_profiles_representative_id_unique` ON `crm_representative_profiles` (`representative_id`);--> statement-breakpoint
CREATE TABLE `crm_tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`representative_id` integer NOT NULL,
	`crm_user_id` integer NOT NULL,
	`interaction_id` integer,
	`title` text NOT NULL,
	`description` text,
	`priority` text DEFAULT 'medium',
	`status` text DEFAULT 'pending',
	`due_date` integer,
	`completed_at` integer,
	`ai_generated` integer DEFAULT 0,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `crm_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`full_name` text NOT NULL,
	`email` text NOT NULL,
	`role` text DEFAULT 'agent',
	`is_active` integer DEFAULT 1,
	`last_login_at` integer,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `crm_users_username_unique` ON `crm_users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `crm_users_email_unique` ON `crm_users` (`email`);--> statement-breakpoint
CREATE TABLE `file_imports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`file_name` text NOT NULL,
	`records_processed` integer DEFAULT 0,
	`records_skipped` integer DEFAULT 0,
	`status` text DEFAULT 'processing',
	`error_details` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `financial_ledger` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`representative_id` integer NOT NULL,
	`transaction_date` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`transaction_type` text NOT NULL,
	`amount` real NOT NULL,
	`running_balance` real NOT NULL,
	`reference_id` integer,
	`reference_number` text,
	`description` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `invoice_batches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`batch_name` text NOT NULL,
	`upload_date` integer DEFAULT CURRENT_TIMESTAMP,
	`file_name` text NOT NULL,
	`total_invoices` integer DEFAULT 0,
	`total_amount` real DEFAULT 0,
	`processing_status` text DEFAULT 'pending',
	`created_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `invoice_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_id` integer NOT NULL,
	`description` text NOT NULL,
	`service_type` text NOT NULL,
	`duration_months` integer NOT NULL,
	`quantity` real DEFAULT 1,
	`unit_price` real NOT NULL,
	`total_price` real NOT NULL,
	`commission_rate` real,
	`commission_amount` real
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_number` text NOT NULL,
	`representative_id` integer,
	`batch_id` integer,
	`total_amount` real NOT NULL,
	`base_amount` real NOT NULL,
	`discount_amount` real DEFAULT 0,
	`tax_amount` real DEFAULT 0,
	`status` text DEFAULT 'pending',
	`due_date` integer,
	`paid_date` integer,
	`invoice_data` text,
	`auto_calculated` integer DEFAULT 1,
	`price_source` text DEFAULT 'representative_rate',
	`telegram_sent` integer DEFAULT 0,
	`sent_to_representative` integer DEFAULT 0,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP,
	`user_id` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_invoice_number_unique` ON `invoices` (`invoice_number`);--> statement-breakpoint
CREATE TABLE `representatives` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`full_name` text NOT NULL,
	`admin_username` text NOT NULL,
	`telegram_id` text,
	`phone_number` text,
	`store_name` text,
	`limited_price_1_month` real DEFAULT 900,
	`limited_price_2_month` real DEFAULT 900,
	`limited_price_3_month` real DEFAULT 900,
	`limited_price_4_month` real DEFAULT 1400,
	`limited_price_5_month` real DEFAULT 1500,
	`limited_price_6_month` real DEFAULT 1600,
	`unlimited_price_1_month` real DEFAULT 40000,
	`unlimited_price_2_month` real DEFAULT 80000,
	`unlimited_price_3_month` real DEFAULT 120000,
	`unlimited_price_4_month` real DEFAULT 160000,
	`unlimited_price_5_month` real DEFAULT 200000,
	`unlimited_price_6_month` real DEFAULT 240000,
	`status` text DEFAULT 'active',
	`sourcing_type` text DEFAULT 'direct',
	`collaborator_id` integer,
	`volume_commission_rate` real,
	`unlimited_commission_rate` real,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `representatives_admin_username_unique` ON `representatives` (`admin_username`);--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`value` text,
	`description` text,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `settings_key_unique` ON `settings` (`key`);--> statement-breakpoint
CREATE TABLE `statistics_cache` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`metric_key` text NOT NULL,
	`metric_value` text NOT NULL,
	`data_type` text DEFAULT 'number',
	`calculated_at` integer DEFAULT CURRENT_TIMESTAMP,
	`valid_until` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `statistics_cache_metric_key_unique` ON `statistics_cache` (`metric_key`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`full_name` text,
	`role` text DEFAULT 'admin',
	`created_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);