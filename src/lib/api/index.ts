import type {
	Member,
	Tag,
	Project,
	TaskWithRelations,
	TaskSearchResult,
	CreateMemberBody,
	UpdateMemberBody,
	CreateTagBody,
	CreateProjectBody,
	UpdateProjectBody,
	CreateTaskBody,
	UpdateTaskBody
} from '$lib/types';

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
	const res = await fetch(url, {
		headers: { 'Content-Type': 'application/json', ...init?.headers },
		...init
	});
	if (!res.ok) {
		const msg = await res.text().catch(() => res.statusText);
		throw new Error(msg);
	}
	if (res.status === 204) return undefined as T;
	return res.json();
}

export const membersApi = {
	list: () => apiFetch<Member[]>('/api/members'),
	get: (id: string) => apiFetch<Member>(`/api/members/${id}`),
	create: (body: CreateMemberBody) =>
		apiFetch<Member>('/api/members', { method: 'POST', body: JSON.stringify(body) }),
	update: (id: string, body: UpdateMemberBody) =>
		apiFetch<Member>(`/api/members/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
	delete: (id: string) => apiFetch<void>(`/api/members/${id}`, { method: 'DELETE' })
};

export const projectsApi = {
	list: () => apiFetch<Project[]>('/api/projects'),
	get: (id: string) => apiFetch<Project>(`/api/projects/${id}`),
	create: (body: CreateProjectBody) =>
		apiFetch<Project>('/api/projects', { method: 'POST', body: JSON.stringify(body) }),
	update: (id: string, body: UpdateProjectBody) =>
		apiFetch<Project>(`/api/projects/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
	delete: (id: string) => apiFetch<void>(`/api/projects/${id}`, { method: 'DELETE' })
};

export const tagsApi = {
	list: () => apiFetch<Tag[]>('/api/tags'),
	create: (body: CreateTagBody) =>
		apiFetch<Tag>('/api/tags', { method: 'POST', body: JSON.stringify(body) }),
	delete: (id: string) => apiFetch<void>(`/api/tags/${id}`, { method: 'DELETE' })
};

export const tasksApi = {
	list: (params?: { project_id?: string; my_tasks?: boolean }) => {
		const qs = new URLSearchParams();
		if (params?.project_id) qs.set('project_id', params.project_id);
		if (params?.my_tasks) qs.set('my_tasks', 'true');
		return apiFetch<TaskWithRelations[]>(`/api/tasks${qs.size ? `?${qs}` : ''}`);
	},
	get: (id: string) => apiFetch<TaskWithRelations>(`/api/tasks/${id}`),
	create: (body: CreateTaskBody) =>
		apiFetch<TaskWithRelations>('/api/tasks', { method: 'POST', body: JSON.stringify(body) }),
	update: (id: string, body: UpdateTaskBody) =>
		apiFetch<TaskWithRelations>(`/api/tasks/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(body)
		}),
	delete: (id: string) => apiFetch<void>(`/api/tasks/${id}`, { method: 'DELETE' }),
	search: (q: string, excludeId?: string) => {
		const qs = new URLSearchParams({ q });
		if (excludeId) qs.set('exclude_id', excludeId);
		return apiFetch<TaskSearchResult[]>(`/api/tasks/search?${qs}`);
	}
};
