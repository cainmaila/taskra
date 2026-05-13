import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireDb } from '$lib/server/db/require';
import { TaskRepository } from '$lib/server/db/repositories/task.repo';

export const GET: RequestHandler = async ({ platform, url }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	if (!q) return json([]);

	const excludeId = url.searchParams.get('exclude_id') ?? undefined;
	const db = requireDb(platform);
	const results = await new TaskRepository(db).search(q, excludeId);
	return json(results);
};
