import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireDb } from '$lib/server/db/require';
import { TagRepository } from '$lib/server/db/repositories/tag.repo';
import { z } from 'zod';

const createSchema = z.object({
	name: z.string().min(1),
	color: z.string().optional()
});

export const GET: RequestHandler = async ({ platform }) => {
	const db = requireDb(platform);
	return json(await new TagRepository(db).findAll());
};

export const POST: RequestHandler = async ({ platform, request }) => {
	const body = await request.json().catch(() => ({}));
	const parsed = createSchema.safeParse(body);
	if (!parsed.success) error(400, parsed.error.message);

	const db = requireDb(platform);
	const tag = await new TagRepository(db).create(parsed.data);
	return json(tag, { status: 201 });
};
