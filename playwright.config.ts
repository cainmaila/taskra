import { defineConfig } from '@playwright/test';

export default defineConfig({
	workers: 1,
	use: {
		baseURL: 'http://127.0.0.1:8788'
	},
	webServer: {
		command:
			'rm -rf .wrangler/playwright && pnpm build && ./node_modules/.bin/wrangler d1 migrations apply taskra-db --local --persist-to .wrangler/playwright && ./node_modules/.bin/wrangler pages dev .svelte-kit/cloudflare --persist-to .wrangler/playwright',
		port: 8788,
		reuseExistingServer: false,
		timeout: 120000
	},
	testMatch: '**/*.e2e.{ts,js}'
});
