import type { InferSelectModel } from 'drizzle-orm';
import type { members, tags, projects, tasks } from '$lib/server/db/schema';

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done' | 'archived';
export type TaskPriority = 'low' | 'medium' | 'high';

export type Member = InferSelectModel<typeof members>;
export type Tag = InferSelectModel<typeof tags>;
export type Project = InferSelectModel<typeof projects>;
export type Task = InferSelectModel<typeof tasks>;

export interface TaskWithRelations extends Task {
	assignee: Member | null;
	tags: Tag[];
	project_ids: string[];
	children: TaskWithRelations[];
}

export interface CreateMemberBody {
	name: string;
	avatar_color?: string;
}

export interface UpdateMemberBody {
	name?: string;
	avatar_color?: string;
}

export interface CreateTagBody {
	name: string;
	color?: string;
}

export interface CreateProjectBody {
	name: string;
	description?: string;
	color?: string;
}

export interface UpdateProjectBody {
	name?: string;
	description?: string | null;
	color?: string;
}

export interface CreateTaskBody {
	title: string;
	assignee_id: string;
	status?: TaskStatus;
	priority?: TaskPriority;
	due_date?: string | null;
	description?: string | null;
	parent_task_id?: string | null;
	tag_ids?: string[];
	project_ids?: string[];
}

export interface TaskSearchResult {
	id: string;
	title: string;
	tags: Tag[];
	project_ids: string[];
}

export interface UpdateTaskBody {
	title?: string;
	assignee_id?: string;
	status?: TaskStatus;
	priority?: TaskPriority;
	due_date?: string | null;
	description?: string | null;
	parent_task_id?: string | null;
	sort_order?: number;
	tag_ids?: string[];
	project_ids?: string[];
}
