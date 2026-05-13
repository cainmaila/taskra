PRAGMA foreign_keys=OFF;--> statement-breakpoint
INSERT OR IGNORE INTO `members` (`id`, `name`, `avatar_color`)
VALUES ('legacy-unassigned', 'Legacy Unassigned', '#6b7280');--> statement-breakpoint
CREATE TABLE `__new_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`assignee_id` text NOT NULL,
	`status` text DEFAULT 'todo' NOT NULL,
	`priority` text DEFAULT 'medium' NOT NULL,
	`due_date` text,
	`description` text,
	`parent_task_id` text,
	`sort_order` real DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`assignee_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`parent_task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_tasks`("id", "title", "assignee_id", "status", "priority", "due_date", "description", "parent_task_id", "sort_order", "created_at", "updated_at")
SELECT
	"id",
	"title",
	CASE
		WHEN "assignee_id" IS NOT NULL
			AND EXISTS(SELECT 1 FROM `members` WHERE `members`.`id` = `tasks`.`assignee_id`)
		THEN "assignee_id"
		ELSE 'legacy-unassigned'
	END,
	"status",
	"priority",
	"due_date",
	"description",
	"parent_task_id",
	"sort_order",
	"created_at",
	"updated_at"
FROM `tasks`;--> statement-breakpoint
DROP TABLE `tasks`;--> statement-breakpoint
ALTER TABLE `__new_tasks` RENAME TO `tasks`;--> statement-breakpoint
PRAGMA foreign_keys=ON;