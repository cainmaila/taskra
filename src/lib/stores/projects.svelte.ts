import type { Project, CreateProjectBody, UpdateProjectBody } from '$lib/types';
import { projectsApi } from '$lib/api/index';

class ProjectStore {
	projects = $state<Project[]>([]);
	loading = $state(false);
	error = $state<string | null>(null);

	async load() {
		this.loading = true;
		this.error = null;
		try {
			this.projects = await projectsApi.list();
		} catch (e) {
			this.error = (e as Error).message;
		} finally {
			this.loading = false;
		}
	}

	async create(body: CreateProjectBody) {
		const project = await projectsApi.create(body);
		this.projects = [...this.projects, project].sort((a, b) => a.name.localeCompare(b.name));
		return project;
	}

	async update(id: string, body: UpdateProjectBody) {
		const updated = await projectsApi.update(id, body);
		this.projects = this.projects.map((p) => (p.id === id ? updated : p));
		return updated;
	}

	async delete(id: string) {
		await projectsApi.delete(id);
		this.projects = this.projects.filter((p) => p.id !== id);
	}
}

export const projectStore = new ProjectStore();
