import { eq } from 'drizzle-orm';
import type { AppDb } from '../db/index';
import { tasks } from '../db/schema';

const BLOCKING_STATUSES = ['todo', 'in_progress', 'blocked'];

export async function canCompleteTask(
	db: AppDb,
	taskId: string
): Promise<{ allowed: boolean; blocking: string[] }> {
	const blocking: string[] = [];
	const queue = [taskId];

	while (queue.length > 0) {
		const parentId = queue.shift()!;
		const children = await db
			.select({ id: tasks.id, title: tasks.title, status: tasks.status })
			.from(tasks)
			.where(eq(tasks.parent_task_id, parentId));

		for (const child of children) {
			if (BLOCKING_STATUSES.includes(child.status)) {
				blocking.push(child.title);
			}
			queue.push(child.id);
		}
	}

	return { allowed: blocking.length === 0, blocking };
}
