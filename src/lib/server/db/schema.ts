import { sqliteTable, text, real, primaryKey } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core';

const nowIso = sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;

export const members = sqliteTable('members', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	avatar_color: text('avatar_color').notNull().default('#6366f1')
});

export const tags = sqliteTable('tags', {
	id: text('id').primaryKey(),
	name: text('name').notNull().unique(),
	color: text('color').notNull().default('#64748b')
});

export const projects = sqliteTable('projects', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description'),
	color: text('color').notNull().default('#3b82f6'),
	created_at: text('created_at').notNull().default(nowIso)
});

export const tasks = sqliteTable('tasks', {
	id: text('id').primaryKey(),
	title: text('title').notNull(),
	assignee_id: text('assignee_id')
		.notNull()
		.references(() => members.id),
	status: text('status', { enum: ['todo', 'in_progress', 'blocked', 'done', 'archived'] })
		.notNull()
		.default('todo'),
	priority: text('priority', { enum: ['low', 'medium', 'high'] })
		.notNull()
		.default('medium'),
	due_date: text('due_date'),
	description: text('description'),
	parent_task_id: text('parent_task_id').references((): AnySQLiteColumn => tasks.id, {
		onDelete: 'set null'
	}),
	sort_order: real('sort_order').notNull().default(0),
	created_at: text('created_at').notNull().default(nowIso),
	updated_at: text('updated_at').notNull().default(nowIso)
});

export const task_tags = sqliteTable(
	'task_tags',
	{
		task_id: text('task_id')
			.notNull()
			.references(() => tasks.id, { onDelete: 'cascade' }),
		tag_id: text('tag_id')
			.notNull()
			.references(() => tags.id, { onDelete: 'cascade' })
	},
	(t) => [primaryKey({ columns: [t.task_id, t.tag_id] })]
);

export const task_projects = sqliteTable(
	'task_projects',
	{
		task_id: text('task_id')
			.notNull()
			.references(() => tasks.id, { onDelete: 'cascade' }),
		project_id: text('project_id')
			.notNull()
			.references(() => projects.id, { onDelete: 'cascade' })
	},
	(t) => [primaryKey({ columns: [t.task_id, t.project_id] })]
);
