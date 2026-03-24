import { fontData } from 'astro:assets';
import { getCollection } from 'astro:content';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import type { APIRoute, GetStaticPaths } from 'astro';
import { createElement } from 'react';
import satori from 'satori';

import { getOgOverlayProps, OgOverlay } from '../../og/OgOverlay';

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const OG_FONT_VARIABLE = '--font-og-sans';
const OG_FONT_NAME = 'Og Sans';

const backgroundPath = join(process.cwd(), 'src/assets/ogp-background.png');
const backgroundDataUriPromise = readFile(backgroundPath).then((buffer) => {
	return `data:image/png;base64,${buffer.toString('base64')}`;
});
const fontCache = new Map<string, Promise<ArrayBuffer | Buffer>>();

export const prerender = true;

function getFontSource(weight: number) {
	const variant = fontData[OG_FONT_VARIABLE]?.find((candidate) => {
		return (
			Number(candidate.weight ?? '400') === weight &&
			(candidate.style ?? 'normal') === 'normal'
		);
	});

	const source =
		variant?.src.find((candidate) => candidate.format === 'woff') ??
		variant?.src[0];

	if (!source) {
		throw new Error(
			`Font data for ${OG_FONT_VARIABLE} weight ${weight} is unavailable.`
		);
	}

	return source.url;
}

async function loadFontBuffer(requestUrl: URL, weight: number) {
	const sourcePath = getFontSource(weight);
	const cacheKey = `${weight}:${sourcePath}`;
	const cached = fontCache.get(cacheKey);

	if (cached) {
		return cached;
	}

	const pending = (async () => {
		if (import.meta.env.PROD && sourcePath.startsWith('/')) {
			return readFile(join(process.cwd(), 'dist', sourcePath.slice(1)));
		}

		const sourceUrl = new URL(sourcePath, requestUrl.origin).toString();
		const response = await fetch(sourceUrl);

		if (!response.ok) {
			throw new Error(`Unable to fetch OG font: ${sourceUrl}`);
		}

		return response.arrayBuffer();
	})();

	fontCache.set(cacheKey, pending);
	return pending;
}

export const getStaticPaths = (async () => {
	const docs = await getCollection('docs');

	return docs.map((entry) => ({
		params: { slug: entry.id },
		props: { title: entry.data.title },
	}));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props, url }) => {
	const title =
		typeof props.title === 'string'
			? props.title
			: 'AI-Agent Friendly EcoSystem';
	const [backgroundSrc, mediumFont, boldFont] = await Promise.all([
		backgroundDataUriPromise,
		loadFontBuffer(url, 500),
		loadFontBuffer(url, 700),
	]);
	const svg = await satori(
		createElement(
			OgOverlay,
			getOgOverlayProps({
				title,
				backgroundSrc,
			})
		),
		{
			width: OG_WIDTH,
			height: OG_HEIGHT,
			fonts: [
				{ name: OG_FONT_NAME, data: mediumFont, weight: 500, style: 'normal' },
				{ name: OG_FONT_NAME, data: boldFont, weight: 700, style: 'normal' },
			],
		}
	);
	const image = new Resvg(svg).render().asPng();

	return new Response(image, {
		headers: {
			'Content-Type': 'image/png',
			'Cache-Control': 'public, max-age=31536000, immutable',
		},
	});
};
