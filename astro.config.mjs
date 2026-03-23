// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'AI-Agent Friendly EcoSystem',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/UtakataKyosui' }],
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
