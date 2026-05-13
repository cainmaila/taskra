import { eq } from 'drizzle-orm';
import type { AppDb } from '../index';
import { tags } from '../schema';
import type { Tag, CreateTagBody } from '$lib/types';
import { nanoid } from 'nanoid';

export class TagRepository {
	constructor(private db: AppDb) {}

	async findAll(): Promise<Tag[]> {
		return this.db.select().from(tags).orderBy(tags.name);
	}

	async findById(id: string): Promise<Tag | null> {
		const rows = await this.db.select().from(tags).where(eq(tags.id, id));
		return rows[0] ?? null;
	}

	async create(body: CreateTagBody): Promise<Tag> {
		const id = nanoid();
		await this.db.insert(tags).values({
			id,
			name: body.name,
			color: body.color ?? '#64748b'
		});
		return (await this.findById(id))!;
	}

	async delete(id: string): Promise<void> {
		// task_tags rows cascade-delete via FK
		await this.db.delete(tags).where(eq(tags.id, id));
	}
}
