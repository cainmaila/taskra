import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireDb } from '$lib/server/db/require';
import { MemberRepository } from '$lib/server/db/repositories/member.repo';
import { z } from 'zod';

const updateSchema = z.object({
	name: z.string().min(1).optional(),
	avatar_color: z.string().optional()
});

export const GET: RequestHandler = async ({ platform, params }) => {
	const db = requireDb(platform);
	const member = await new MemberRepository(db).findById(params.id);
	if (!member) error(404, 'Member not found');
	return json(member);
};

export const PATCH: RequestHandler = async ({ platform, params, request }) => {
	const body = await request.json().catch(() => ({}));
	const parsed = updateSchema.safeParse(body);
	if (!parsed.success) error(400, parsed.error.message);

	const db = requireDb(platform);
	const repo = new MemberRepository(db);
	const member = await repo.update(params.id, parsed.data);
	if (!member) error(404, 'Member not found');
	return json(member);
};

export const DELETE: RequestHandler = async ({ platform, params }) => {
	const db = requireDb(platform);
	const repo = new MemberRepository(db);
	const member = await repo.findById(params.id);
	if (!member) error(404, 'Member not found');
	const hasTasks = await repo.hasAssignedTasks(params.id);
	if (hasTasks) error(409, 'Member has assigned tasks. Reassign tasks before deleting.');
	await repo.delete(params.id);
	return new Response(null, { status: 204 });
};
