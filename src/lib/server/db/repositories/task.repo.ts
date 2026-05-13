import { eq, isNull, asc, inArray, sql, like } from 'drizzle-orm';
import type { AppDb } from '../index';
import { tasks, members, tags, task_tags, task_projects } from '../schema';
import type {
	TaskWithRelations,
	CreateTaskBody,
	UpdateTaskBody,
	Member,
	Tag,
	TaskSearchResult
} from '$lib/types';
import { nanoid } from 'nanoid';

export class TaskRepository {
	constructor(private db: AppDb) {}

	/**
	 * Returns all tasks for a given project (via ancestor inheritance) or all unprojectd tasks.
	 * Tree assembly happens here; clients receive pre-nested JSON.
	 */
	async findAll(filters?: { project_id?: string | null }): Promise<TaskWithRelations[]> {
		// Fetch flat task rows
		const taskRows = await this.db.select().from(tasks).orderBy(asc(tasks.sort_order));

		if (taskRows.length === 0) return [];

		const taskIds = taskRows.map((t) => t.id);

		// Fetch relations in parallel
		const [memberRows, tagJoinRows, projectJoinRows] = await Promise.all([
			this.db.select().from(members),
			this.db
				.select({
					task_id: task_tags.task_id,
					tag_id: task_tags.tag_id,
					name: tags.name,
					color: tags.color
				})
				.from(task_tags)
				.innerJoin(tags, eq(task_tags.tag_id, tags.id))
				.where(inArray(task_tags.task_id, taskIds)),
			this.db
				.select({ task_id: task_projects.task_id, project_id: task_projects.project_id })
				.from(task_projects)
				.where(inArray(task_projects.task_id, taskIds))
		]);

		const memberMap = new Map<string, Member>(memberRows.map((m) => [m.id, m]));
		const tagsByTask = new Map<string, Tag[]>();
		const projectsByTask = new Map<string, string[]>();

		for (const row of tagJoinRows) {
			if (!tagsByTask.has(row.task_id)) tagsByTask.set(row.task_id, []);
			tagsByTask.get(row.task_id)!.push({ id: row.tag_id, name: row.name, color: row.color });
		}
		for (const row of projectJoinRows) {
			if (!projectsByTask.has(row.task_id)) projectsByTask.set(row.task_id, []);
			projectsByTask.get(row.task_id)!.push(row.project_id);
		}

		// Build rich task objects
		const richTasks: TaskWithRelations[] = taskRows.map((t) => ({
			...t,
			assignee: t.assignee_id ? (memberMap.get(t.assignee_id) ?? null) : null,
			tags: tagsByTask.get(t.id) ?? [],
			project_ids: projectsByTask.get(t.id) ?? [],
			children: []
		}));

		// Apply project filter using ancestor inheritance
		let visibleTasks = richTasks;
		if (filters?.project_id) {
			visibleTasks = this.filterByProject(richTasks, filters.project_id);
		} else if (filters?.project_id === null) {
			// "My Tasks" — tasks with no project (including unprojectd root tasks only)
			const unprojectdRoots = richTasks.filter(
				(t) => !t.parent_task_id && t.project_ids.length === 0
			);
			visibleTasks = this.getDescendants(richTasks, unprojectdRoots);
		}

		return this.buildTree(visibleTasks);
	}

	/** Returns all tasks whose direct project_ids include projectId, plus all their descendants. */
	private filterByProject(all: TaskWithRelations[], projectId: string): TaskWithRelations[] {
		const projectRoots = all.filter((t) => t.project_ids.includes(projectId));
		return this.getDescendants(all, projectRoots);
	}

	private getDescendants(
		all: TaskWithRelations[],
		roots: TaskWithRelations[]
	): TaskWithRelations[] {
		const included = new Set<string>(roots.map((t) => t.id));

		const queue = [...roots];
		while (queue.length > 0) {
			const current = queue.shift()!;
			for (const t of all) {
				if (t.parent_task_id === current.id && !included.has(t.id)) {
					included.add(t.id);
					queue.push(t);
				}
			}
		}

		return all.filter((t) => included.has(t.id));
	}

	private buildTree(flat: TaskWithRelations[]): TaskWithRelations[] {
		const map = new Map<string, TaskWithRelations>(flat.map((t) => [t.id, { ...t, children: [] }]));
		const roots: TaskWithRelations[] = [];

		for (const task of map.values()) {
			if (task.parent_task_id && map.has(task.parent_task_id)) {
				map.get(task.parent_task_id)!.children.push(task);
			} else {
				roots.push(task);
			}
		}

		return roots;
	}

	async findById(id: string): Promise<TaskWithRelations | null> {
		const rows = await this.db.select().from(tasks).where(eq(tasks.id, id));
		if (!rows[0]) return null;

		const t = rows[0];
		const [assigneeRows, tagJoinRows, projectJoinRows] = await Promise.all([
			t.assignee_id
				? this.db.select().from(members).where(eq(members.id, t.assignee_id))
				: Promise.resolve([]),
			this.db
				.select({ tag_id: task_tags.tag_id, name: tags.name, color: tags.color })
				.from(task_tags)
				.innerJoin(tags, eq(task_tags.tag_id, tags.id))
				.where(eq(task_tags.task_id, id)),
			this.db
				.select({ project_id: task_projects.project_id })
				.from(task_projects)
				.where(eq(task_projects.task_id, id))
		]);

		return {
			...t,
			assignee: assigneeRows[0] ?? null,
			tags: tagJoinRows.map((r) => ({ id: r.tag_id, name: r.name, color: r.color })),
			project_ids: projectJoinRows.map((r) => r.project_id),
			children: []
		};
	}

	async create(body: CreateTaskBody): Promise<TaskWithRelations> {
		const id = nanoid();
		const maxOrder = await this.db
			.select({ max: sql<number>`MAX(sort_order)` })
			.from(tasks)
			.where(
				body.parent_task_id
					? eq(tasks.parent_task_id, body.parent_task_id)
					: isNull(tasks.parent_task_id)
			);
		const sort_order = (maxOrder[0]?.max ?? 0) + 1;

		await this.db.insert(tasks).values({
			id,
			title: body.title,
			assignee_id: body.assignee_id ?? null,
			status: body.status ?? 'todo',
			priority: body.priority ?? 'medium',
			due_date: body.due_date ?? null,
			description: body.description ?? null,
			parent_task_id: body.parent_task_id ?? null,
			sort_order
		});

		await this.syncRelations(id, body.tag_ids, body.project_ids);
		return (await this.findById(id))!;
	}

	async update(id: string, body: UpdateTaskBody): Promise<TaskWithRelations | null> {
		const now = new Date().toISOString();
		const fields: Partial<typeof tasks.$inferInsert> = { updated_at: now };

		if (body.title !== undefined) fields.title = body.title;
		if (body.assignee_id !== undefined) fields.assignee_id = body.assignee_id;
		if (body.status !== undefined) fields.status = body.status;
		if (body.priority !== undefined) fields.priority = body.priority;
		if (body.due_date !== undefined) fields.due_date = body.due_date;
		if (body.description !== undefined) fields.description = body.description;
		if (body.parent_task_id !== undefined) fields.parent_task_id = body.parent_task_id;
		if (body.sort_order !== undefined) fields.sort_order = body.sort_order;

		await this.db.update(tasks).set(fields).where(eq(tasks.id, id));

		if (body.tag_ids !== undefined || body.project_ids !== undefined) {
			await this.syncRelations(id, body.tag_ids, body.project_ids);
		}

		return this.findById(id);
	}

	async search(query: string, excludeId?: string): Promise<TaskSearchResult[]> {
		// Find all descendants of excludeId via recursive CTE to prevent cycles
		let excludeIds: string[] = [];
		if (excludeId) {
			const rows = await this.db.run(sql`
				WITH RECURSIVE descendants(id) AS (
					SELECT id FROM tasks WHERE id = ${excludeId}
					UNION ALL
					SELECT t.id FROM tasks t
					INNER JOIN descendants d ON t.parent_task_id = d.id
				)
				SELECT id FROM descendants
			`);
			excludeIds = (rows.results as { id: string }[]).map((r) => r.id);
		}

		const pattern = `%${query}%`;
		let taskRows = await this.db
			.select()
			.from(tasks)
			.where(like(tasks.title, pattern))
			.orderBy(asc(tasks.sort_order))
			.limit(20);

		if (excludeIds.length > 0) {
			taskRows = taskRows.filter((t) => !excludeIds.includes(t.id));
		}

		if (taskRows.length === 0) return [];

		const taskIds = taskRows.map((t) => t.id);
		const [tagJoinRows, projectJoinRows] = await Promise.all([
			this.db
				.select({
					task_id: task_tags.task_id,
					tag_id: task_tags.tag_id,
					name: tags.name,
					color: tags.color
				})
				.from(task_tags)
				.innerJoin(tags, eq(task_tags.tag_id, tags.id))
				.where(inArray(task_tags.task_id, taskIds)),
			this.db
				.select({ task_id: task_projects.task_id, project_id: task_projects.project_id })
				.from(task_projects)
				.where(inArray(task_projects.task_id, taskIds))
		]);

		const tagsByTask = new Map<string, Tag[]>();
		const projectsByTask = new Map<string, string[]>();
		for (const row of tagJoinRows) {
			if (!tagsByTask.has(row.task_id)) tagsByTask.set(row.task_id, []);
			tagsByTask.get(row.task_id)!.push({ id: row.tag_id, name: row.name, color: row.color });
		}
		for (const row of projectJoinRows) {
			if (!projectsByTask.has(row.task_id)) projectsByTask.set(row.task_id, []);
			projectsByTask.get(row.task_id)!.push(row.project_id);
		}

		return taskRows.map((t) => ({
			id: t.id,
			title: t.title,
			tags: tagsByTask.get(t.id) ?? [],
			project_ids: projectsByTask.get(t.id) ?? []
		}));
	}

	async delete(id: string): Promise<void> {
		// Promote direct children to root (parent_task_id = null)
		await this.db.update(tasks).set({ parent_task_id: null }).where(eq(tasks.parent_task_id, id));
		await this.db.delete(tasks).where(eq(tasks.id, id));
	}

	private async syncRelations(
		taskId: string,
		tagIds?: string[],
		projectIds?: string[]
	): Promise<void> {
		if (tagIds !== undefined) {
			await this.db.delete(task_tags).where(eq(task_tags.task_id, taskId));
			if (tagIds.length > 0) {
				await this.db
					.insert(task_tags)
					.values(tagIds.map((tag_id) => ({ task_id: taskId, tag_id })));
			}
		}
		if (projectIds !== undefined) {
			await this.db.delete(task_projects).where(eq(task_projects.task_id, taskId));
			if (projectIds.length > 0) {
				await this.db
					.insert(task_projects)
					.values(projectIds.map((project_id) => ({ task_id: taskId, project_id })));
			}
		}
	}
}
