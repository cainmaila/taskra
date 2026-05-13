import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireDb } from '$lib/server/db/require';
import { ProjectRepository } from '$lib/server/db/repositories/project.repo';
import { z } from 'zod';

const updateSchema = z.object({
	name: z.string().min(1).optional(),
	description: z.string().nullable().optional(),
	color: z.string().optional()
});

export const GET: RequestHandler = async ({ platform, params }) => {
	const db = requireDb(platform);
	const project = await new ProjectRepository(db).findById(params.id);
	if (!project) error(404, 'Project not found');
	return json(project);
};

export const PATCH: RequestHandler = async ({ platform, params, request }) => {
	const body = await request.json().catch(() => ({}));
	const parsed = updateSchema.safeParse(body);
	if (!parsed.success) error(400, parsed.error.message);

	const db = requireDb(platform);
	const repo = new ProjectRepository(db);
	const project = await repo.update(params.id, parsed.data);
	if (!project) error(404, 'Project not found');
	return json(project);
};

export const DELETE: RequestHandler = async ({ platform, params }) => {
	const db = requireDb(platform);
	const repo = new ProjectRepository(db);
	const project = await repo.findById(params.id);
	if (!project) error(404, 'Project not found');
	await repo.delete(params.id);
	return new Response(null, { status: 204 });
};
