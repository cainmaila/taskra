import type { TaskWithRelations } from '$lib/types';

class UIStore {
	taskModalOpen = $state(false);
	taskModalMode = $state<'create' | 'edit'>('create');
	taskModalParentId = $state<string | null>(null);
	taskModalTask = $state<TaskWithRelations | null>(null);

	openCreate(parentId?: string) {
		this.taskModalMode = 'create';
		this.taskModalParentId = parentId ?? null;
		this.taskModalTask = null;
		this.taskModalOpen = true;
	}

	openEdit(task: TaskWithRelations) {
		this.taskModalMode = 'edit';
		this.taskModalParentId = null;
		this.taskModalTask = task;
		this.taskModalOpen = true;
	}

	closeTaskModal() {
		this.taskModalOpen = false;
		this.taskModalTask = null;
		this.taskModalParentId = null;
	}
}

export const uiStore = new UIStore();
