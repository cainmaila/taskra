<script lang="ts">
	import type { TaskWithRelations } from '$lib/types';
	import { taskStore } from '$lib/stores/tasks.svelte';
	import { uiStore } from '$lib/stores/ui.svelte';
	import TaskRow from './TaskRow.svelte';

	interface Props {
		task: TaskWithRelations;
		depth?: number;
	}

	let { task, depth = 0 }: Props = $props();
	let expanded = $state(true);

	const statusColors: Record<string, string> = {
		todo: 'bg-surface-300-700',
		in_progress: 'bg-primary-500',
		blocked: 'bg-error-500',
		done: 'bg-success-500',
		archived: 'bg-surface-400-600'
	};

	const statusLabels: Record<string, string> = {
		todo: 'Todo',
		in_progress: 'In Progress',
		blocked: 'Blocked',
		done: 'Done',
		archived: 'Archived'
	};

	const priorityIcons: Record<string, string> = {
		low: '↓',
		medium: '→',
		high: '↑'
	};

	function getBlockingDescendantTitles(node: TaskWithRelations): string[] {
		const blocking: string[] = [];

		for (const child of node.children) {
			if (child.status !== 'done' && child.status !== 'archived') {
				blocking.push(child.title);
			}
			blocking.push(...getBlockingDescendantTitles(child));
		}

		return blocking;
	}

	async function toggleDone() {
		const newStatus = task.status === 'done' ? 'todo' : 'done';
		try {
			await taskStore.update(task.id, { status: newStatus });
		} catch (e) {
			alert((e as Error).message);
		}
	}

	const isDone = $derived(task.status === 'done' || task.status === 'archived');
	const hasChildren = $derived(task.children.length > 0);
	const indentPx = $derived(depth * 20);
	const blockingTitles = $derived(getBlockingDescendantTitles(task));
	const completionBlocked = $derived(task.status !== 'done' && blockingTitles.length > 0);
	const completionHint = $derived(
		completionBlocked
			? `Complete subtasks first: ${blockingTitles.join(', ')}`
			: task.status === 'archived'
				? 'Archived tasks cannot be changed'
				: ''
	);
</script>

<div class="group">
	<div
		class="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-surface-100-900 {isDone
			? 'opacity-60'
			: ''}"
		style="padding-left: {indentPx + 8}px"
	>
		<!-- Expand toggle -->
		{#if hasChildren}
			<button
				class="flex size-4 shrink-0 items-center justify-center text-xs text-surface-400-600 hover:text-surface-700-300"
				onclick={() => (expanded = !expanded)}
				aria-label={expanded ? 'Collapse' : 'Expand'}
			>
				{expanded ? '▾' : '▸'}
			</button>
		{:else}
			<span class="size-4 shrink-0"></span>
		{/if}

		<!-- Done checkbox -->
		<input
			type="checkbox"
			class="checkbox shrink-0"
			checked={task.status === 'done'}
			disabled={task.status === 'archived' || completionBlocked}
			onchange={toggleDone}
			title={completionHint}
		/>

		<!-- Priority icon -->
		<span
			class="shrink-0 text-sm font-bold {task.priority === 'high'
				? 'text-error-500'
				: task.priority === 'medium'
					? 'text-warning-500'
					: 'text-surface-400-600'}"
			title="Priority: {task.priority}"
		>
			{priorityIcons[task.priority]}
		</span>

		<!-- Title -->
		<button
			class="flex-1 truncate text-left text-sm {isDone ? 'text-surface-400-600 line-through' : ''}"
			onclick={() => uiStore.openEdit(task)}
		>
			{task.title}
		</button>

		<!-- Assignee avatar -->
		{#if task.assignee}
			<span
				class="flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
				style="background-color: {task.assignee.avatar_color}"
				title={task.assignee.name}
			>
				{task.assignee.name[0].toUpperCase()}
			</span>
		{/if}

		<!-- Status badge -->
		<span
			class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium text-white {statusColors[
				task.status
			]}"
		>
			{statusLabels[task.status]}
		</span>

		<!-- Due date -->
		{#if task.due_date}
			<span
				class="shrink-0 text-xs {new Date(task.due_date) < new Date() && !isDone
					? 'font-semibold text-error-500'
					: 'text-surface-400-600'}"
			>
				{task.due_date}
			</span>
		{/if}

		<!-- Row actions (visible on hover) -->
		<div class="invisible flex shrink-0 gap-1 group-hover:visible">
			<button
				class="preset-ghost btn btn-sm text-xs"
				onclick={() => uiStore.openCreate(task.id)}
				title="Add subtask"
			>
				+
			</button>
			<button
				class="preset-ghost btn btn-sm text-xs text-error-500"
				onclick={async () => {
					if (confirm(`Delete "${task.title}"?`)) await taskStore.delete(task.id);
				}}
				title="Delete task"
			>
				✕
			</button>
		</div>
	</div>

	{#if completionBlocked}
		<div class="px-2 pb-1 text-xs text-error-500" style="padding-left: {indentPx + 52}px">
			Blocked by incomplete subtasks: {blockingTitles.join(', ')}
		</div>
	{/if}

	<!-- Children -->
	{#if expanded && hasChildren}
		{#each task.children as child (child.id)}
			<TaskRow task={child} depth={depth + 1} />
		{/each}
	{/if}
</div>
