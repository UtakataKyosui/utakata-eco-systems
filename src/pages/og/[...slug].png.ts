import { getCollection } from 'astro:content';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { APIRoute, GetStaticPaths } from 'astro';
import sharp from 'sharp';

import { OG_HEIGHT, OG_WIDTH, renderOgOverlaySvg } from '../../og/render';

const backgroundPath = join(process.cwd(), 'src/assets/ogp-background.png');

export const prerender = true;

export const getStaticPaths = (async () => {
	const docs = await getCollection('docs');

	return docs.map((entry) => ({
		params: { slug: entry.id },
		props: { title: entry.data.title },
	}));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
	const background = await readFile(backgroundPath);
	const title =
		typeof props.title === 'string'
			? props.title
			: 'AI-Agent Friendly EcoSystem';
	const overlay = renderOgOverlaySvg(title);

	const image = await sharp(background)
		.resize(OG_WIDTH, OG_HEIGHT, { fit: 'cover', position: 'attention' })
		.composite([{ input: Buffer.from(overlay), top: 0, left: 0 }])
		.png()
		.toBuffer();

	return new Response(image, {
		headers: {
			'Content-Type': 'image/png',
			'Cache-Control': 'public, max-age=31536000, immutable',
		},
	});
};
