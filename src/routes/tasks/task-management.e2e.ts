import { expect, test } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';

type Member = {
	id: string;
	name: string;
	avatar_color: string;
};

type Project = {
	id: string;
	name: string;
	description: string | null;
	color: string;
	created_at: string;
};

type Task = {
	id: string;
	title: string;
	assignee_id: string;
	status: 'todo' | 'in_progress' | 'blocked' | 'done' | 'archived';
	project_ids: string[];
	parent_task_id: string | null;
	children: Task[];
};

function uniqueName(prefix: string): string {
	return `${prefix} ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function createMember(request: APIRequestContext, name: string) {
	const response = await request.post('/api/members', {
		data: { name, avatar_color: '#2563eb' }
	});

	expect(response.ok()).toBeTruthy();
	return (await response.json()) as Member;
}

async function createProject(request: APIRequestContext, name: string) {
	const response = await request.post('/api/projects', {
		data: { name, description: 'Playwright project', color: '#10b981' }
	});

	expect(response.ok()).toBeTruthy();
	return (await response.json()) as Project;
}

async function createTask(
	request: APIRequestContext,
	body: {
		title: string;
		assignee_id: string;
		project_ids?: string[];
		parent_task_id?: string | null;
		status?: Task['status'];
	}
) {
	const response = await request.post('/api/tasks', {
		data: {
			title: body.title,
			assignee_id: body.assignee_id,
			status: body.status ?? 'todo',
			priority: 'medium',
			project_ids: body.project_ids ?? [],
			parent_task_id: body.parent_task_id ?? null
		}
	});

	expect(response.ok()).toBeTruthy();
	return (await response.json()) as Task;
}

test('can create members and projects from the management screens', async ({ page }) => {
	const memberName = uniqueName('E2E Member');
	const projectName = uniqueName('E2E Project');

	await page.goto('/members');
	await page.getByRole('button', { name: /Add Member/i }).click();
	await page.getByPlaceholder('Member name').fill(memberName);
	await page.getByRole('button', { name: /^Add$/ }).click();
	await expect(page.getByText(memberName)).toBeVisible();

	await page.goto('/projects');
	await page.getByRole('button', { name: /^\+ New Project$/ }).click();
	await page.getByPlaceholder('Project name').fill(projectName);
	await page.getByPlaceholder('Optional description').fill('Created by Playwright');
	await page.getByRole('button', { name: /^Create$/ }).click();
	await expect(page.getByRole('heading', { name: projectName })).toBeVisible();
	await expect(page.getByText('Created by Playwright')).toBeVisible();
});

test('cancel button closes create-task modal without creating a task', async ({
	page,
	request
}) => {
	const taskTitle = uniqueName('Should Not Exist');

	await page.goto('/tasks');

	await page.getByRole('button', { name: /\+ New Task/i }).click();
	await expect(page.getByRole('dialog', { name: 'Create Task' })).toBeVisible();

	await page.getByPlaceholder('Task title').fill(taskTitle);

	await page.getByRole('button', { name: /^Cancel$/ }).click();

	await expect(page.getByRole('dialog', { name: 'Create Task' })).not.toBeVisible();

	const response = await request.get('/api/tasks?my_tasks=true');
	const tasks = (await response.json()) as Task[];
	expect(tasks.some((t) => t.title === taskTitle)).toBe(false);
});

test('member picker: shows in My Tasks, hidden in project view', async ({ page, request }) => {
	const member = await createMember(request, uniqueName('Picker Visibility'));

	await page.goto('/tasks');
	await expect(page.getByRole('button', { name: member.name })).toBeVisible({ timeout: 10000 });

	const project = await createProject(request, uniqueName('Picker Project'));
	await page.goto(`/tasks?project_id=${project.id}`);
	await expect(page.getByRole('button', { name: member.name })).not.toBeVisible();
});

test('member picker: filters tasks by selected member', async ({ page, request }) => {
	const alice = await createMember(request, uniqueName('Alice Picker'));
	const bob = await createMember(request, uniqueName('Bob Picker'));

	const aliceTitle = uniqueName('Alice Task');
	const bobTitle = uniqueName('Bob Task');

	await createTask(request, { title: aliceTitle, assignee_id: alice.id });
	await createTask(request, { title: bobTitle, assignee_id: bob.id });

	await page.goto('/tasks');
	await expect(page.getByRole('button', { name: aliceTitle })).toBeVisible({ timeout: 10000 });
	await expect(page.getByRole('button', { name: bobTitle })).toBeVisible();

	await page.getByRole('button', { name: alice.name }).click();
	await expect(page.getByRole('button', { name: aliceTitle })).toBeVisible();
	await expect(page.getByRole('button', { name: bobTitle })).not.toBeVisible();

	await page.getByRole('button', { name: bob.name }).click();
	await expect(page.getByRole('button', { name: bobTitle })).toBeVisible();
	await expect(page.getByRole('button', { name: aliceTitle })).not.toBeVisible();
});

test('member picker: All button clears filter', async ({ page, request }) => {
	const member = await createMember(request, uniqueName('Clear Filter Member'));
	const other = await createMember(request, uniqueName('Other Member'));

	await createTask(request, { title: uniqueName('Member Task'), assignee_id: member.id });
	await createTask(request, { title: uniqueName('Other Task'), assignee_id: other.id });

	await page.goto('/tasks');
	await page.getByRole('button', { name: member.name }).click({ timeout: 10000 });

	// "All" button should be non-active (tonal) when a member is selected
	const allBtn = page.getByRole('button', { name: 'All' });
	await allBtn.click();

	// Both tasks should now be visible
	const taskCount = await page.locator('.card .border-b').count();
	expect(taskCount).toBeGreaterThanOrEqual(2);
});

test('member picker: clicking active member deselects and shows all', async ({ page, request }) => {
	const alice = await createMember(request, uniqueName('Deselect Alice'));
	const bob = await createMember(request, uniqueName('Deselect Bob'));

	await createTask(request, { title: uniqueName('Alice Task'), assignee_id: alice.id });
	await createTask(request, { title: uniqueName('Bob Task'), assignee_id: bob.id });

	await page.goto('/tasks');
	const aliceBtn = page.getByRole('button', { name: alice.name });
	await aliceBtn.click({ timeout: 10000 });

	// click again to deselect
	await aliceBtn.click();

	// Bob's task should reappear
	const taskRows = await page.locator('.card .border-b').count();
	expect(taskRows).toBeGreaterThanOrEqual(2);
});

test('member picker: tree filter keeps parent when child matches', async ({ page, request }) => {
	const alice = await createMember(request, uniqueName('Tree Alice'));
	const bob = await createMember(request, uniqueName('Tree Bob'));

	const parentTitle = uniqueName('Parent (Alice)');
	const childTitle = uniqueName('Child (Bob)');

	const parent = await createTask(request, { title: parentTitle, assignee_id: alice.id });
	await createTask(request, {
		title: childTitle,
		assignee_id: bob.id,
		parent_task_id: parent.id
	});

	await page.goto('/tasks');
	const bobBtn = page.getByRole('button', { name: bob.name });
	await bobBtn.click({ timeout: 10000 });

	// Bob's child task visible; parent (Alice) also visible as context
	await expect(page.getByRole('button', { name: childTitle })).toBeVisible();
	await expect(page.getByRole('button', { name: parentTitle })).toBeVisible();
});

test('member picker: stale localStorage member clears on load', async ({ page, request }) => {
	const member = await createMember(request, uniqueName('Stale Member'));

	// Seed localStorage with a non-existent member ID
	await page.goto('/tasks');
	await page.evaluate(() => localStorage.setItem('taskra:my_tasks_member', 'nonexistent-id-12345'));
	await page.reload();

	// Should not show empty state with a stale filter active
	// "All" button should be active (primary style)
	const allBtn = page.getByRole('button', { name: 'All' });
	await expect(allBtn).toBeVisible({ timeout: 10000 });
	await expect(allBtn).toHaveClass(/preset-filled-primary/);

	// localStorage should be cleared
	const stored = await page.evaluate(() => localStorage.getItem('taskra:my_tasks_member'));
	expect(stored).toBeNull();

	// Clean up
	await request.delete(`/api/members/${member.id}`);
});

test('enforces hierarchy completion rules and preserves subtasks on delete', async ({
	page,
	request
}) => {
	const member = await createMember(request, uniqueName('Hierarchy Member'));
	const project = await createProject(request, uniqueName('Hierarchy Project'));
	const parentTitle = uniqueName('Parent Task');
	const childTitle = uniqueName('Child Task');

	const parentTask = await createTask(request, {
		title: parentTitle,
		assignee_id: member.id,
		project_ids: [project.id]
	});

	await createTask(request, {
		title: childTitle,
		assignee_id: member.id,
		parent_task_id: parentTask.id,
		project_ids: [project.id]
	});

	await page.goto('/projects');
	const projectCard = page
		.getByRole('heading', { name: project.name })
		.locator('xpath=ancestor::div[contains(@class, "card")][1]');
	const tasksResponse = page.waitForResponse(
		(response) => response.url().includes(`/api/tasks?project_id=${project.id}`) && response.ok()
	);
	await projectCard.getByRole('link', { name: 'View Tasks' }).click();
	await tasksResponse;

	const parentTitleButton = page.getByRole('button', { name: parentTitle });
	const childTitleButton = page.getByRole('button', { name: childTitle });
	const parentRow = parentTitleButton.locator(
		'xpath=ancestor::div[contains(@class, "flex items-center")][1]'
	);
	const parentCheckbox = parentRow.locator('input[type="checkbox"]');

	await expect(parentTitleButton).toBeVisible({ timeout: 10000 });
	await expect(childTitleButton).toBeVisible();
	await expect(page.getByText(`Blocked by incomplete subtasks: ${childTitle}`)).toBeVisible();
	await expect(parentCheckbox).toBeDisabled();

	await childTitleButton.click();
	await page.getByLabel('Status').selectOption('done');
	await page.getByRole('button', { name: /^Save$/ }).click();

	await expect(page.getByText(`Blocked by incomplete subtasks: ${childTitle}`)).toHaveCount(0);
	await expect(parentCheckbox).toBeEnabled();
	await parentCheckbox.check();
	await expect(parentCheckbox).toBeChecked();

	page.once('dialog', async (dialog) => {
		await dialog.accept();
	});
	await parentTitleButton.hover();
	await parentRow.locator('button[title="Delete task"]').click({ force: true });

	await expect(parentTitleButton).toHaveCount(0);
	await expect(page.getByRole('button', { name: childTitle })).toBeVisible();
	await expect(page.getByText(`Blocked by incomplete subtasks: ${childTitle}`)).toHaveCount(0);
});
