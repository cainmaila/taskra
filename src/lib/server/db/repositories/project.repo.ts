import { eq } from 'drizzle-orm';
import type { AppDb } from '../index';
import { projects } from '../schema';
import type { Project, CreateProjectBody, UpdateProjectBody } from '$lib/types';
import { nanoid } from 'nanoid';

export class ProjectRepository {
	constructor(private db: AppDb) {}

	async findAll(): Promise<Project[]> {
		return this.db.select().from(projects).orderBy(projects.name);
	}

	async findById(id: string): Promise<Project | null> {
		const rows = await this.db.select().from(projects).where(eq(projects.id, id));
		return rows[0] ?? null;
	}

	async create(body: CreateProjectBody): Promise<Project> {
		const id = nanoid();
		await this.db.insert(projects).values({
			id,
			name: body.name,
			description: body.description ?? null,
			color: body.color ?? '#3b82f6'
		});
		return (await this.findById(id))!;
	}

	async update(id: string, body: UpdateProjectBody): Promise<Project | null> {
		const fields: Partial<typeof projects.$inferInsert> = {};
		if (body.name !== undefined) fields.name = body.name;
		if (body.description !== undefined) fields.description = body.description;
		if (body.color !== undefined) fields.color = body.color;
		if (Object.keys(fields).length === 0) return this.findById(id);
		await this.db.update(projects).set(fields).where(eq(projects.id, id));
		return this.findById(id);
	}

	async delete(id: string): Promise<void> {
		// task_projects cascade deletes via FK; tasks move to "My Tasks" (no project)
		await this.db.delete(projects).where(eq(projects.id, id));
	}
}
