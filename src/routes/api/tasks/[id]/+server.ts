import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireDb } from '$lib/server/db/require';
import { TaskRepository } from '$lib/server/db/repositories/task.repo';
import { canCompleteTask } from '$lib/server/rules/completion.rule';
import { z } from 'zod';

const updateSchema = z.object({
	title: z.string().min(1).optional(),
	assignee_id: z.string().min(1).optional(),
	status: z.enum(['todo', 'in_progress', 'blocked', 'done', 'archived']).optional(),
	priority: z.enum(['low', 'medium', 'high']).optional(),
	due_date: z.string().nullable().optional(),
	description: z.string().nullable().optional(),
	parent_task_id: z.string().nullable().optional(),
	sort_order: z.number().optional(),
	tag_ids: z.array(z.string()).optional(),
	project_ids: z.array(z.string()).optional()
});

export const GET: RequestHandler = async ({ platform, params }) => {
	const db = requireDb(platform);
	const task = await new TaskRepository(db).findById(params.id);
	if (!task) error(404, 'Task not found');
	return json(task);
};

export const PATCH: RequestHandler = async ({ platform, params, request }) => {
	const body = await request.json().catch(() => ({}));
	const parsed = updateSchema.safeParse(body);
	if (!parsed.success) error(400, parsed.error.message);

	const db = requireDb(platform);

	if (parsed.data.status === 'done') {
		const { allowed, blocking } = await canCompleteTask(db, params.id);
		if (!allowed) {
			error(422, `Cannot complete task. Incomplete subtasks: ${blocking.join(', ')}`);
		}
	}

	const task = await new TaskRepository(db).update(params.id, parsed.data);
	if (!task) error(404, 'Task not found');
	return json(task);
};

export const DELETE: RequestHandler = async ({ platform, params }) => {
	const db = requireDb(platform);
	const repo = new TaskRepository(db);
	const task = await repo.findById(params.id);
	if (!task) error(404, 'Task not found');
	await repo.delete(params.id);
	return new Response(null, { status: 204 });
};
