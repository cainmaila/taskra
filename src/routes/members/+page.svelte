<script lang="ts">
	import { memberStore } from '$lib/stores/members.svelte';
	import type { Member } from '$lib/types';
	import { onMount } from 'svelte';

	let showModal = $state(false);
	let editingMember = $state<Member | null>(null);
	let name = $state('');
	let avatar_color = $state('#6366f1');
	let saving = $state(false);
	let error = $state<string | null>(null);

	const COLORS = [
		'#6366f1',
		'#3b82f6',
		'#10b981',
		'#f59e0b',
		'#ef4444',
		'#8b5cf6',
		'#ec4899',
		'#14b8a6'
	];

	onMount(() => memberStore.load());

	function openCreate() {
		editingMember = null;
		name = '';
		avatar_color = '#6366f1';
		error = null;
		showModal = true;
	}

	function openEdit(member: Member) {
		editingMember = member;
		name = member.name;
		avatar_color = member.avatar_color;
		error = null;
		showModal = true;
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		saving = true;
		error = null;
		try {
			if (editingMember) {
				await memberStore.update(editingMember.id, { name, avatar_color });
			} else {
				await memberStore.create({ name, avatar_color });
			}
			showModal = false;
		} catch (e) {
			error = (e as Error).message;
		} finally {
			saving = false;
		}
	}

	async function handleDelete(member: Member) {
		if (!confirm(`Delete member "${member.name}"? They must have no assigned tasks.`)) return;
		try {
			await memberStore.delete(member.id);
		} catch (e) {
			alert((e as Error).message);
		}
	}
</script>

<div class="p-6">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="h3">Team Members</h1>
		<button class="btn preset-filled-primary-500" onclick={openCreate}>+ Add Member</button>
	</div>

	{#if memberStore.members.length === 0 && !memberStore.loading}
		<div class="flex flex-col items-center justify-center gap-3 py-16 text-surface-400-600">
			<p>No members yet.</p>
			<button class="btn preset-tonal" onclick={openCreate}>Add your first member</button>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{#each memberStore.members as member (member.id)}
				<div class="flex items-center gap-3 card p-4">
					<span
						class="flex size-10 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
						style="background-color: {member.avatar_color}"
					>
						{member.name[0].toUpperCase()}
					</span>
					<span class="flex-1 font-medium">{member.name}</span>
					<div class="flex gap-1">
						<button class="preset-ghost btn btn-sm" onclick={() => openEdit(member)} title="Edit"
							>✎</button
						>
						<button
							class="preset-ghost btn btn-sm text-error-500"
							onclick={() => handleDelete(member)}
							title="Delete">✕</button
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
		<div class="w-full max-w-sm card p-6 shadow-xl">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="h4">{editingMember ? 'Edit Member' : 'Add Member'}</h2>
				<button class="preset-ghost btn btn-sm" onclick={() => (showModal = false)}>✕</button>
			</div>
			<form onsubmit={handleSubmit} class="flex flex-col gap-4">
				<label class="label">
					<span class="label-text">Name <span class="text-error-500">*</span></span>
					<input class="input" type="text" bind:value={name} required placeholder="Member name" />
				</label>
				<fieldset>
					<legend class="mb-2 label-text">Avatar color</legend>
					<div class="flex flex-wrap gap-2">
						{#each COLORS as color (color)}
							<button
								type="button"
								class="size-7 rounded-full border-2 transition-transform hover:scale-110"
								style="background-color: {color}; border-color: {avatar_color === color
									? 'white'
									: 'transparent'}"
								onclick={() => (avatar_color = color)}
								aria-label="Color {color}"
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
						{saving ? 'Saving…' : editingMember ? 'Save' : 'Add'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
