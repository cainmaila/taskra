import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireDb } from '$lib/server/db/require';
import { TagRepository } from '$lib/server/db/repositories/tag.repo';

export const DELETE: RequestHandler = async ({ platform, params }) => {
	const db = requireDb(platform);
	const repo = new TagRepository(db);
	const tag = await repo.findById(params.id);
	if (!tag) error(404, 'Tag not found');
	await repo.delete(params.id);
	return new Response(null, { status: 204 });
};
