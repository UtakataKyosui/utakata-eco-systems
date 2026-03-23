// @ts-check

import cloudflare from '@astrojs/cloudflare';
import mdx from '@astrojs/mdx';
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	output: 'server',
	adapter: cloudflare({
		configPath: './wrangler.jsonc',
		prerenderEnvironment: 'node',
	}),
	integrations: [
		starlight({
			title: 'AI-Agent Friendly EcoSystem',
			prerender: false,
			routeMiddleware: './src/routeData.ts',
			social: [
				{
					icon: 'github',
					label: 'GitHub',
					href: 'https://github.com/UtakataKyosui',
				},
			],
			sidebar: [
				{
					label: 'ガイド',
					items: [
						// Each item here is one entry in the navigation menu.
						{ label: '概要と前提', slug: 'guides/example' },
					],
				},
				{
					label: 'リファレンス',
					autogenerate: { directory: 'reference' },
				},
			],
		}),
		mdx(),
	],
});
