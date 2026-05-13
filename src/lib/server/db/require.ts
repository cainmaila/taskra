import { error } from '@sveltejs/kit';
import { createDb } from './index';
import type { AppDb } from './index';

export function requireDb(platform: App.Platform | undefined): AppDb {
	if (!platform?.env?.DB) {
		error(503, 'Database not available. Run via wrangler: pnpm wrangler pages dev');
	}
	return createDb(platform.env.DB);
}
