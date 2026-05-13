<script lang="ts">
	import './layout.css';
	import { resolve } from '$app/paths';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { projectStore } from '$lib/stores/projects.svelte';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(async () => {
		await projectStore.load();
	});

	function isActive(href: string) {
		return page.url.pathname === href || page.url.pathname.startsWith(href + '/');
	}
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="flex h-screen overflow-hidden bg-surface-50-950">
	<aside
		class="flex w-56 shrink-0 flex-col gap-1 border-r border-surface-200-800 bg-surface-100-900 p-3"
	>
		<div class="mb-2 px-2">
			<span class="text-lg font-bold text-primary-500">Taskra</span>
		</div>

		<a
			href={resolve('/tasks')}
			class="btn {isActive('/tasks') && !page.url.searchParams.has('project_id')
				? 'preset-filled-primary-500'
				: 'preset-tonal'} justify-start text-sm"
		>
			📋 My Tasks
		</a>

		<hr class="my-2 border-surface-300-700" />

		<span class="px-2 text-xs font-semibold tracking-wide text-surface-400-600 uppercase">
			Projects
		</span>

		{#each projectStore.projects as project (project.id)}
			<a
				href={resolve(`/tasks?project_id=${project.id}`)}
				class="btn {page.url.searchParams.get('project_id') === project.id
					? 'preset-filled-primary-500'
					: 'preset-tonal'} justify-start gap-2 text-sm"
			>
				<span class="size-2.5 shrink-0 rounded-full" style="background-color: {project.color}"
				></span>
				<span class="truncate">{project.name}</span>
			</a>
		{/each}

		{#if projectStore.projects.length === 0 && !projectStore.loading}
			<p class="px-2 text-xs text-surface-400-600">No projects yet</p>
		{/if}

		<div class="mt-auto flex flex-col gap-1 border-t border-surface-300-700 pt-3">
			<a
				href={resolve('/projects')}
				class="btn {isActive('/projects')
					? 'preset-filled-secondary-500'
					: 'preset-ghost'} justify-start text-sm"
			>
				⚙ Projects
			</a>
			<a
				href={resolve('/members')}
				class="btn {isActive('/members')
					? 'preset-filled-secondary-500'
					: 'preset-ghost'} justify-start text-sm"
			>
				👥 Members
			</a>
		</div>
	</aside>

	<main class="flex-1 overflow-auto">
		{@render children()}
	</main>
</div>
