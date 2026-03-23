// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'UtakataKyosui’s EcoSystem',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/withastro/starlight' }],
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
