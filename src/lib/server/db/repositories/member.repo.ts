import { eq } from 'drizzle-orm';
import type { AppDb } from '../index';
import { members } from '../schema';
import type { Member, CreateMemberBody, UpdateMemberBody } from '$lib/types';
import { nanoid } from 'nanoid';

export class MemberRepository {
	constructor(private db: AppDb) {}

	async findAll(): Promise<Member[]> {
		return this.db.select().from(members).orderBy(members.name);
	}

	async findById(id: string): Promise<Member | null> {
		const rows = await this.db.select().from(members).where(eq(members.id, id));
		return rows[0] ?? null;
	}

	async create(body: CreateMemberBody): Promise<Member> {
		const id = nanoid();
		await this.db.insert(members).values({
			id,
			name: body.name,
			avatar_color: body.avatar_color ?? '#6366f1'
		});
		return (await this.findById(id))!;
	}

	async update(id: string, body: UpdateMemberBody): Promise<Member | null> {
		const fields: Partial<typeof members.$inferInsert> = {};
		if (body.name !== undefined) fields.name = body.name;
		if (body.avatar_color !== undefined) fields.avatar_color = body.avatar_color;
		if (Object.keys(fields).length === 0) return this.findById(id);
		await this.db.update(members).set(fields).where(eq(members.id, id));
		return this.findById(id);
	}

	async delete(id: string): Promise<void> {
		await this.db.delete(members).where(eq(members.id, id));
	}

	async hasAssignedTasks(id: string): Promise<boolean> {
		const { tasks } = await import('../schema');
		const rows = await this.db
			.select({ id: tasks.id })
			.from(tasks)
			.where(eq(tasks.assignee_id, id));
		return rows.length > 0;
	}
}
