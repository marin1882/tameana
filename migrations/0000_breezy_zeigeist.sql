CREATE TABLE `availability_exceptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`fecha` text NOT NULL,
	`hora_inicio` text,
	`hora_fin` text
);
--> statement-breakpoint
CREATE TABLE `availability_rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`dia_semana` integer NOT NULL,
	`hora_inicio` text NOT NULL,
	`hora_fin` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`service_id` integer NOT NULL,
	`fecha` text NOT NULL,
	`hora_inicio` text NOT NULL,
	`hora_fin` text NOT NULL,
	`nombre` text NOT NULL,
	`email` text NOT NULL,
	`telefono` text NOT NULL,
	`mensaje` text,
	`estado` text DEFAULT 'pendiente' NOT NULL,
	`payment_status` text DEFAULT 'no_aplica' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_bookings_slot` ON `bookings` (`fecha`,`hora_inicio`) WHERE "bookings"."estado" != 'cancelada';--> statement-breakpoint
CREATE TABLE `services` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`nombre` text NOT NULL,
	`descripcion` text NOT NULL,
	`duracion_min` integer DEFAULT 60 NOT NULL,
	`precio_cents` integer,
	`activo` integer DEFAULT true NOT NULL,
	`orden` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `services_slug_unique` ON `services` (`slug`);