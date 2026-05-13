import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireDb } from '$lib/server/db/require';
import { TaskRepository } from '$lib/server/db/repositories/task.repo';
import { z } from 'zod';

const createSchema = z.object({
	title: z.string().min(1),
	assignee_id: z.string().min(1),
	status: z.enum(['todo', 'in_progress', 'blocked', 'done', 'archived']).optional(),
	priority: z.enum(['low', 'medium', 'high']).optional(),
	due_date: z.string().nullable().optional(),
	description: z.string().nullable().optional(),
	parent_task_id: z.string().nullable().optional(),
	tag_ids: z.array(z.string()).optional(),
	project_ids: z.array(z.string()).optional()
});

export const GET: RequestHandler = async ({ platform, url }) => {
	const db = requireDb(platform);
	const projectId = url.searchParams.get('project_id');
	const myTasks = url.searchParams.get('my_tasks') === 'true';

	const tasks = await new TaskRepository(db).findAll(
		projectId ? { project_id: projectId } : myTasks ? { project_id: null } : undefined
	);
	return json(tasks);
};

export const POST: RequestHandler = async ({ platform, request }) => {
	const body = await request.json().catch(() => ({}));
	const parsed = createSchema.safeParse(body);
	if (!parsed.success) error(400, parsed.error.message);

	const db = requireDb(platform);
	const task = await new TaskRepository(db).create(parsed.data);
	return json(task, { status: 201 });
};
