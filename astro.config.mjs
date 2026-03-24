// @ts-check

import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

const fallbackSiteUrl = 'https://utakata-eco-systems-docs.pages.dev';
const configuredSiteUrl =
	process.env.PUBLIC_SITE_URL ||
	process.env.SITE_URL ||
	process.env.CF_PAGES_URL ||
	fallbackSiteUrl;

// https://astro.build/config
export default defineConfig({
	output: 'static',
	site: configuredSiteUrl,
	integrations: [
		starlight({
			title: 'AI-Agent Friendly EcoSystem',
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
	],
});
