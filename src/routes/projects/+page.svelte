<script lang="ts">
	import { resolve } from '$app/paths';
	import { projectStore } from '$lib/stores/projects.svelte';
	import type { Project } from '$lib/types';
	import { onMount } from 'svelte';

	let showModal = $state(false);
	let editingProject = $state<Project | null>(null);
	let name = $state('');
	let description = $state('');
	let color = $state('#3b82f6');
	let saving = $state(false);
	let error = $state<string | null>(null);

	const COLORS = [
		'#3b82f6',
		'#6366f1',
		'#10b981',
		'#f59e0b',
		'#ef4444',
		'#8b5cf6',
		'#ec4899',
		'#14b8a6',
		'#f97316',
		'#06b6d4'
	];

	onMount(() => projectStore.load());

	function openCreate() {
		editingProject = null;
		name = '';
		description = '';
		color = '#3b82f6';
		error = null;
		showModal = true;
	}

	function openEdit(project: Project) {
		editingProject = project;
		name = project.name;
		description = project.description ?? '';
		color = project.color;
		error = null;
		showModal = true;
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		saving = true;
		error = null;
		try {
			if (editingProject) {
				await projectStore.update(editingProject.id, {
					name,
					description: description || null,
					color
				});
			} else {
				await projectStore.create({ name, description: description || undefined, color });
			}
			showModal = false;
		} catch (e) {
			error = (e as Error).message;
		} finally {
			saving = false;
		}
	}

	async function handleDelete(project: Project) {
		if (!confirm(`Delete project "${project.name}"? Tasks will move to My Tasks.`)) return;
		await projectStore.delete(project.id);
	}
</script>

<div class="p-6">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="h3">Projects</h1>
		<button class="btn preset-filled-primary-500" onclick={openCreate}>+ New Project</button>
	</div>

	{#if projectStore.projects.length === 0 && !projectStore.loading}
		<div class="flex flex-col items-center justify-center gap-3 py-16 text-surface-400-600">
			<p>No projects yet.</p>
			<button class="btn preset-tonal" onclick={openCreate}>Create your first project</button>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each projectStore.projects as project (project.id)}
				<div class="card p-5">
					<div class="flex items-start gap-3">
						<span
							class="mt-0.5 size-4 shrink-0 rounded-full"
							style="background-color: {project.color}"
						></span>
						<div class="min-w-0 flex-1">
							<h3 class="font-semibold">{project.name}</h3>
							{#if project.description}
								<p class="mt-1 line-clamp-2 text-sm text-surface-400-600">{project.description}</p>
							{/if}
							<p class="mt-2 text-xs text-surface-400-600">
								Created {new Date(project.created_at).toLocaleDateString()}
							</p>
						</div>
					</div>
					<div class="mt-4 flex justify-end gap-2">
						<a href={resolve(`/tasks?project_id=${project.id}`)} class="btn preset-tonal btn-sm"
							>View Tasks</a
						>
						<button class="preset-ghost btn btn-sm" onclick={() => openEdit(project)}>✎</button>
						<button
							class="preset-ghost btn btn-sm text-error-500"
							onclick={() => handleDelete(project)}>✕</button
						>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

{#if showModal}
	<div
		class="fixed inset-0 z-40 bg-black/50"
		role="presentation"
		onclick={() => (showModal = false)}
	></div>
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		role="dialog"
		aria-modal="true"
	>
		<div class="w-full max-w-md card p-6 shadow-xl">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="h4">{editingProject ? 'Edit Project' : 'New Project'}</h2>
				<button class="preset-ghost btn btn-sm" onclick={() => (showModal = false)}>✕</button>
			</div>
			<form onsubmit={handleSubmit} class="flex flex-col gap-4">
				<label class="label">
					<span class="label-text">Name <span class="text-error-500">*</span></span>
					<input class="input" type="text" bind:value={name} required placeholder="Project name" />
				</label>
				<label class="label">
					<span class="label-text">Description</span>
					<textarea
						class="textarea"
						bind:value={description}
						rows={2}
						placeholder="Optional description"
					></textarea>
				</label>
				<fieldset>
					<legend class="mb-2 label-text">Color</legend>
					<div class="flex flex-wrap gap-2">
						{#each COLORS as c (c)}
							<button
								type="button"
								class="size-7 rounded-full border-2 transition-transform hover:scale-110"
								style="background-color: {c}; border-color: {color === c ? 'white' : 'transparent'}"
								onclick={() => (color = c)}
								aria-label="Color {c}"
							></button>
						{/each}
					</div>
				</fieldset>
				{#if error}
					<p class="text-sm text-error-500">{error}</p>
				{/if}
				<div class="flex justify-end gap-2">
					<button type="button" class="preset-ghost btn" onclick={() => (showModal = false)}
						>Cancel</button
					>
					<button
						type="submit"
						class="btn preset-filled-primary-500"
						disabled={saving || !name.trim()}
					>
						{saving ? 'Saving…' : editingProject ? 'Save' : 'Create'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
