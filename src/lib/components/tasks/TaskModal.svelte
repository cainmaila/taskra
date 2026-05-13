<script lang="ts">
	import type { CreateTaskBody, UpdateTaskBody, TaskStatus, TaskPriority } from '$lib/types';
	import { taskStore } from '$lib/stores/tasks.svelte';
	import { memberStore } from '$lib/stores/members.svelte';
	import { projectStore } from '$lib/stores/projects.svelte';
	import { uiStore } from '$lib/stores/ui.svelte';
	import { tagsApi } from '$lib/api/index';
	import type { Tag } from '$lib/types';
	import { onMount } from 'svelte';
	import ParentTaskPicker from './ParentTaskPicker.svelte';

	// Component mounts fresh each time the modal opens (parent uses {#if uiStore.taskModalOpen})
	const editTask = uiStore.taskModalTask;
	const mode = uiStore.taskModalMode;

	let tags = $state<Tag[]>([]);
	let saving = $state(false);
	let error = $state<string | null>(null);

	let title = $state(editTask?.title ?? '');
	let assignee_id = $state(editTask?.assignee_id ?? '');
	let status = $state<TaskStatus>(editTask?.status ?? 'todo');
	let priority = $state<TaskPriority>(editTask?.priority ?? 'medium');
	let due_date = $state(editTask?.due_date ?? '');
	let description = $state(editTask?.description ?? '');
	let parent_task_id = $state(editTask?.parent_task_id ?? uiStore.taskModalParentId ?? '');
	let selectedTagIds = $state<string[]>(editTask?.tags.map((t) => t.id) ?? []);
	let selectedProjectIds = $state<string[]>(editTask?.project_ids ?? []);

	onMount(async () => {
		tags = await tagsApi.list();
	});

	function toggleTag(id: string) {
		selectedTagIds = selectedTagIds.includes(id)
			? selectedTagIds.filter((t) => t !== id)
			: [...selectedTagIds, id];
	}

	function toggleProject(id: string) {
		selectedProjectIds = selectedProjectIds.includes(id)
			? selectedProjectIds.filter((p) => p !== id)
			: [...selectedProjectIds, id];
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!title.trim()) return;

		saving = true;
		error = null;

		try {
			const payload = {
				title: title.trim(),
				assignee_id,
				status,
				priority,
				due_date: due_date || null,
				description: description || null,
				parent_task_id: parent_task_id || null,
				tag_ids: selectedTagIds,
				project_ids: selectedProjectIds
			};

			if (mode === 'edit' && editTask) {
				await taskStore.update(editTask.id, payload as UpdateTaskBody);
			} else {
				await taskStore.create(payload as CreateTaskBody);
			}

			await taskStore.reload();
			uiStore.closeTaskModal();
		} catch (err) {
			error = (err as Error).message;
		} finally {
			saving = false;
		}
	}
</script>

<!-- Backdrop -->
<div
	class="fixed inset-0 z-40 bg-black/50"
	role="presentation"
	onclick={() => uiStore.closeTaskModal()}
></div>

<!-- Modal -->
<div
	class="fixed inset-0 z-50 flex items-center justify-center p-4"
	role="dialog"
	aria-modal="true"
	aria-label="{mode === 'edit' ? 'Edit' : 'Create'} Task"
>
	<div class="max-h-[90vh] w-full max-w-lg overflow-y-auto card bg-surface-50 dark:bg-surface-900 p-6 shadow-xl">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="h4">{mode === 'edit' ? 'Edit Task' : 'New Task'}</h2>
			<button
				class="preset-ghost btn btn-sm"
				onclick={() => uiStore.closeTaskModal()}
				aria-label="Close"
			>
				✕
			</button>
		</div>

		<form onsubmit={handleSubmit} class="flex flex-col gap-4">
			<label class="label">
				<span class="label-text">Title <span class="text-error-500">*</span></span>
				<input class="input" type="text" bind:value={title} placeholder="Task title" required />
			</label>

			<label class="label">
				<span class="label-text">Assignee <span class="text-error-500">*</span></span>
				<select class="select" bind:value={assignee_id} required>
					<option value="">— Select assignee —</option>
					{#each memberStore.members as member (member.id)}
						<option value={member.id}>{member.name}</option>
					{/each}
				</select>
			</label>

			<div class="flex gap-3">
				<label class="label flex-1">
					<span class="label-text">Status</span>
					<select class="select" bind:value={status}>
						<option value="todo">Todo</option>
						<option value="in_progress">In Progress</option>
						<option value="blocked">Blocked</option>
						<option value="done">Done</option>
						<option value="archived">Archived</option>
					</select>
				</label>
				<label class="label flex-1">
					<span class="label-text">Priority</span>
					<select class="select" bind:value={priority}>
						<option value="low">↓ Low</option>
						<option value="medium">→ Medium</option>
						<option value="high">↑ High</option>
					</select>
				</label>
			</div>

			<label class="label">
				<span class="label-text">Due date</span>
				<input class="input" type="date" bind:value={due_date} />
			</label>

			<div class="label">
				<span class="label-text">Parent task</span>
				<ParentTaskPicker bind:value={parent_task_id} excludeId={editTask?.id} />
			</div>

			{#if projectStore.projects.length > 0}
				<fieldset>
					<legend class="mb-1 label-text">Projects</legend>
					<div class="flex flex-wrap gap-2">
						{#each projectStore.projects as project (project.id)}
							<button
								type="button"
								class="badge {selectedProjectIds.includes(project.id)
									? 'preset-filled-primary-500'
									: 'preset-tonal'} cursor-pointer"
								onclick={() => toggleProject(project.id)}
							>
								<span
									class="mr-1 inline-block size-2 rounded-full"
									style="background-color: {project.color}"
								></span>
								{project.name}
							</button>
						{/each}
					</div>
				</fieldset>
			{/if}

			{#if tags.length > 0}
				<fieldset>
					<legend class="mb-1 label-text">Tags</legend>
					<div class="flex flex-wrap gap-2">
						{#each tags as tag (tag.id)}
							<button
								type="button"
								class="badge cursor-pointer"
								style={selectedTagIds.includes(tag.id)
									? `background-color: ${tag.color}; color: white`
									: `border: 1px solid ${tag.color}; color: ${tag.color}`}
								onclick={() => toggleTag(tag.id)}
							>
								{tag.name}
							</button>
						{/each}
					</div>
				</fieldset>
			{/if}

			<label class="label">
				<span class="label-text">Description</span>
				<textarea class="textarea" bind:value={description} rows={3} placeholder="Optional notes..."
				></textarea>
			</label>

			{#if error}
				<p class="text-sm text-error-500">{error}</p>
			{/if}

			<div class="flex justify-end gap-2">
				<button type="button" class="preset-ghost btn" onclick={() => uiStore.closeTaskModal()}>
					Cancel
				</button>
				<button
					type="submit"
					class="btn preset-filled-primary-500"
					disabled={saving || !title.trim() || !assignee_id}
				>
					{saving ? 'Saving…' : mode === 'edit' ? 'Save' : 'Create'}
				</button>
			</div>
		</form>
	</div>
</div>
