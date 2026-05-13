import type { Member, CreateMemberBody, UpdateMemberBody } from '$lib/types';
import { membersApi } from '$lib/api/index';

class MemberStore {
	members = $state<Member[]>([]);
	loading = $state(false);
	error = $state<string | null>(null);

	async load() {
		this.loading = true;
		this.error = null;
		try {
			this.members = await membersApi.list();
		} catch (e) {
			this.error = (e as Error).message;
		} finally {
			this.loading = false;
		}
	}

	async create(body: CreateMemberBody) {
		const member = await membersApi.create(body);
		this.members = [...this.members, member].sort((a, b) => a.name.localeCompare(b.name));
		return member;
	}

	async update(id: string, body: UpdateMemberBody) {
		const updated = await membersApi.update(id, body);
		this.members = this.members.map((m) => (m.id === id ? updated : m));
		return updated;
	}

	async delete(id: string) {
		await membersApi.delete(id);
		this.members = this.members.filter((m) => m.id !== id);
	}
}

export const memberStore = new MemberStore();
