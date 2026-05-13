import type { TaskWithRelations, CreateTaskBody, UpdateTaskBody } from '$lib/types';
import { tasksApi } from '$lib/api/index';

type TaskListParams = { project_id?: string; my_tasks?: boolean };

class TaskStore {
	tasks = $state<TaskWithRelations[]>([]);
	loading = $state(false);
	error = $state<string | null>(null);
	currentParams = $state<TaskListParams | undefined>(undefined);

	async load(params?: TaskListParams) {
		this.loading = true;
		this.error = null;
		this.currentParams = params ? { ...params } : undefined;
		try {
			this.tasks = await tasksApi.list(this.currentParams);
		} catch (e) {
			this.error = (e as Error).message;
		} finally {
			this.loading = false;
		}
	}

	async reload() {
		await this.load(this.currentParams);
	}

	async create(body: CreateTaskBody) {
		const task = await tasksApi.create(body);
		this.tasks = [...this.tasks, task];
		return task;
	}

	async update(id: string, body: UpdateTaskBody) {
		const updated = await tasksApi.update(id, body);
		this.tasks = this.updateInTree(this.tasks, id, updated);
		return updated;
	}

	async delete(id: string) {
		await tasksApi.delete(id);
		await this.reload();
	}

	private updateInTree(
		nodes: TaskWithRelations[],
		id: string,
		updated: TaskWithRelations
	): TaskWithRelations[] {
		return nodes.map((t) => {
			if (t.id === id) return { ...updated, children: t.children };
			return { ...t, children: this.updateInTree(t.children, id, updated) };
		});
	}
}

export const taskStore = new TaskStore();
