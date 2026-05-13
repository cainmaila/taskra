<script lang="ts">
	import { page } from '$app/state';
	import { taskStore } from '$lib/stores/tasks.svelte';
	import { memberStore } from '$lib/stores/members.svelte';
	import { projectStore } from '$lib/stores/projects.svelte';
	import { uiStore } from '$lib/stores/ui.svelte';
	import type { TaskWithRelations } from '$lib/types';
	import TaskRow from '$lib/components/tasks/TaskRow.svelte';
	import TaskModal from '$lib/components/tasks/TaskModal.svelte';
	import { onMount, untrack } from 'svelte';
	import { browser } from '$app/environment';

	const LS_KEY = 'taskra:my_tasks_member';

	const projectId = $derived(page.url.searchParams.get('project_id'));
	const currentProject = $derived(
		projectId ? projectStore.projects.find((p) => p.id === projectId) : null
	);

	let selectedMemberId = $state<string | null>(browser ? localStorage.getItem(LS_KEY) : null);

	function selectMember(id: string | null) {
		selectedMemberId = id;
		if (browser) {
			if (id) localStorage.setItem(LS_KEY, id);
			else localStorage.removeItem(LS_KEY);
		}
	}

	function filterTree(nodes: TaskWithRelations[], memberId: string): TaskWithRelations[] {
		return nodes.flatMap((task) => {
			const filteredChildren = filterTree(task.children, memberId);
			if (task.assignee_id === memberId || filteredChildren.length > 0) {
				return [{ ...task, children: filteredChildren }];
			}
			return [];
		});
	}

	const visibleTasks = $derived(
		selectedMemberId && !currentProject
			? filterTree(taskStore.tasks, selectedMemberId)
			: taskStore.tasks
	);

	onMount(async () => {
		await memberStore.load();
		if (selectedMemberId && !memberStore.members.find((m) => m.id === selectedMemberId)) {
			selectMember(null);
		}
	});

	$effect(() => {
		const params = projectId ? { project_id: projectId } : { my_tasks: true };
		untrack(() => {
			void taskStore.load(params);
		});
	});
</script>

<div class="p-6">
	<div class="mb-6 flex items-center justify-between">
		<div>
			{#if currentProject}
				<div class="flex items-center gap-2">
					<span class="size-4 rounded-full" style="background-color: {currentProject.color}"></span>
					<h1 class="h3">{currentProject.name}</h1>
				</div>
				{#if currentProject.description}
					<p class="mt-1 text-sm text-surface-400-600">{currentProject.description}</p>
				{/if}
			{:else}
				<h1 class="h3">My Tasks</h1>
				<p class="mt-1 text-sm text-surface-400-600">Tasks not assigned to any project</p>

				{#if memberStore.members.length > 0}
					<div class="mt-3 flex flex-wrap items-center gap-2">
						<button
							class="btn btn-sm {selectedMemberId === null
								? 'preset-filled-primary-500'
								: 'preset-tonal'} text-xs"
							onclick={() => selectMember(null)}
						>
							All
						</button>
						{#each memberStore.members as member (member.id)}
							<button
								class="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-opacity
									{selectedMemberId === member.id
									? 'opacity-100 ring-2 ring-primary-500 ring-offset-1'
									: 'opacity-70 hover:opacity-100'}"
								style="background-color: {member.avatar_color}20; color: {member.avatar_color}"
								onclick={() => selectMember(selectedMemberId === member.id ? null : member.id)}
								title={member.name}
							>
								<span
									class="flex size-5 items-center justify-center rounded-full text-xs font-semibold text-white"
									style="background-color: {member.avatar_color}"
								>
									{member.name[0].toUpperCase()}
								</span>
								{member.name}
							</button>
						{/each}
					</div>
				{/if}
			{/if}
		</div>
		<button class="btn preset-filled-primary-500" onclick={() => uiStore.openCreate()}>
			+ New Task
		</button>
	</div>

	{#if taskStore.loading}
		<div class="flex items-center justify-center py-16 text-surface-400-600">Loading tasks…</div>
	{:else if taskStore.error}
		<div class="card p-4 text-error-500">Error: {taskStore.error}</div>
	{:else if visibleTasks.length === 0}
		<div class="flex flex-col items-center justify-center gap-3 py-16 text-surface-400-600">
			{#if selectedMemberId && !currentProject}
				<p>No tasks for this member.</p>
				<button class="btn preset-tonal text-sm" onclick={() => selectMember(null)}>
					Show all members
				</button>
			{:else}
				<p>No tasks yet.</p>
				<button class="btn preset-tonal" onclick={() => uiStore.openCreate()}>
					Create your first task
				</button>
			{/if}
		</div>
	{:else}
		<div class="overflow-hidden card p-0">
			{#each visibleTasks as task (task.id)}
				<div class="border-b border-surface-200-800 last:border-0">
					<TaskRow {task} />
				</div>
			{/each}
		</div>
	{/if}
</div>

{#if uiStore.taskModalOpen}
	<TaskModal />
{/if}
