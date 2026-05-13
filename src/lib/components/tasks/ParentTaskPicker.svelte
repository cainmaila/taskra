<script lang="ts">
	import { tasksApi } from '$lib/api/index';
	import { projectStore } from '$lib/stores/projects.svelte';
	import type { TaskSearchResult } from '$lib/types';
	import { onMount } from 'svelte';

	let {
		value = $bindable(''),
		excludeId
	}: {
		value?: string;
		excludeId?: string;
	} = $props();

	let selectedTitle = $state<string | null>(null);
	let query = $state('');
	let results = $state<TaskSearchResult[]>([]);
	let isOpen = $state(false);
	let loading = $state(false);
	let debounceTimer: ReturnType<typeof setTimeout>;
	let inputEl: HTMLInputElement | undefined = $state();

	onMount(async () => {
		if (value) {
			try {
				const task = await tasksApi.get(value);
				selectedTitle = task.title;
			} catch {
				value = '';
			}
		}
	});

	function handleInput() {
		clearTimeout(debounceTimer);
		isOpen = false;
		if (!query.trim()) {
			results = [];
			return;
		}
		loading = true;
		debounceTimer = setTimeout(async () => {
			try {
				results = await tasksApi.search(query, excludeId);
				isOpen = results.length > 0;
			} finally {
				loading = false;
			}
		}, 250);
	}

	function select(result: TaskSearchResult) {
		value = result.id;
		selectedTitle = result.title;
		query = '';
		results = [];
		isOpen = false;
	}

	function clear() {
		value = '';
		selectedTitle = null;
		query = '';
		results = [];
		isOpen = false;
		setTimeout(() => inputEl?.focus(), 0);
	}

	function handleBlur() {
		// Delay so click on result registers before dropdown closes
		setTimeout(() => {
			isOpen = false;
		}, 150);
	}

	function getProjectNames(project_ids: string[]): string {
		return project_ids
			.map((id) => projectStore.projects.find((p) => p.id === id)?.name)
			.filter(Boolean)
			.join(', ');
	}
</script>

<div class="relative">
	{#if selectedTitle}
		<div
			class="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
		>
			<div class="flex min-w-0 items-center gap-2">
				<svg
					class="h-3.5 w-3.5 shrink-0 opacity-50"
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path
						d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"
					/>
				</svg>
				<span class="truncate text-sm font-medium">{selectedTitle}</span>
			</div>
			<button
				type="button"
				class="ml-1 shrink-0 rounded px-1.5 py-0.5 text-xs opacity-60 transition-all hover:bg-error-500/20 hover:text-error-500 hover:opacity-100"
				onclick={clear}
				aria-label="Clear parent task"
			>
				✕
			</button>
		</div>
	{:else}
		<div class="relative">
			<span class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 opacity-40">
				<svg
					class="h-4 w-4"
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
				</svg>
			</span>
			<input
				bind:this={inputEl}
				class="input pl-9"
				type="text"
				bind:value={query}
				oninput={handleInput}
				onblur={handleBlur}
				placeholder="Search tasks by title…"
				autocomplete="off"
			/>
			{#if loading}
				<span class="absolute top-1/2 right-3 -translate-y-1/2 text-xs opacity-50">…</span>
			{/if}
		</div>

		{#if isOpen && results.length > 0}
			<div
				class="absolute right-0 left-0 z-50 mt-1 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
				role="listbox"
				aria-label="Task results"
			>
				<ul class="max-h-60 divide-y divide-zinc-100 overflow-y-auto dark:divide-zinc-700">
					{#each results as result (result.id)}
						{@const projectNames = getProjectNames(result.project_ids)}
						<li>
							<button
								type="button"
								class="flex w-full flex-col gap-1 px-3 py-2.5 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-700"
								role="option"
								aria-selected="false"
								onmousedown={() => select(result)}
							>
								<span class="text-sm leading-tight font-medium text-zinc-900 dark:text-zinc-100"
									>{result.title}</span
								>
								{#if projectNames || result.tags.length > 0}
									<div class="flex flex-wrap items-center gap-1.5">
										{#if projectNames}
											<span class="text-xs text-zinc-400">{projectNames}</span>
										{/if}
										{#each result.tags as tag (tag.id)}
											<span
												class="rounded px-1.5 py-0 text-xs leading-5"
												style="border: 1px solid {tag.color}; color: {tag.color};"
											>
												{tag.name}
											</span>
										{/each}
									</div>
								{/if}
							</button>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	{/if}
</div>
