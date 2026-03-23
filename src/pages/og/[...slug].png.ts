import { getCollection } from 'astro:content';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { APIRoute, GetStaticPaths } from 'astro';
import sharp from 'sharp';

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const TITLE_MAX_LINES = 3;
const ENGLISH_LINE_LIMIT = 22;
const OTHER_LINE_LIMIT = 13;
const backgroundPath = join(process.cwd(), 'src/assets/ogp-background.png');

export const prerender = true;

export const getStaticPaths = (async () => {
	const docs = await getCollection('docs');

	return docs.map((entry) => ({
		params: { slug: entry.id },
		props: { title: entry.data.title },
	}));
}) satisfies GetStaticPaths;

function escapeXml(value: string) {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

function clampTitle(lines: string[]) {
	if (lines.length <= TITLE_MAX_LINES) {
		return lines;
	}

	const clamped = lines.slice(0, TITLE_MAX_LINES);
	const lastLine = clamped[TITLE_MAX_LINES - 1] ?? '';
	clamped[TITLE_MAX_LINES - 1] =
		`${lastLine.slice(0, Math.max(0, lastLine.length - 1))}…`;
	return clamped;
}

function wrapByCharacters(value: string, limit: number) {
	const glyphs = Array.from(value.trim());
	const lines: string[] = [];

	for (let index = 0; index < glyphs.length; index += limit) {
		lines.push(glyphs.slice(index, index + limit).join(''));
	}

	return lines;
}

function wrapTitle(title: string) {
	const normalized = title.replace(/\s+/g, ' ').trim();

	if (!normalized) {
		return ['Untitled'];
	}

	if (/\s/.test(normalized) && /^[ -~]+$/.test(normalized)) {
		const words = normalized.split(' ');
		const lines: string[] = [];
		let current = '';

		for (const word of words) {
			const next = current ? `${current} ${word}` : word;
			if (next.length <= ENGLISH_LINE_LIMIT) {
				current = next;
				continue;
			}

			if (current) {
				lines.push(current);
			}
			current = word;
		}

		if (current) {
			lines.push(current);
		}

		return clampTitle(lines);
	}

	return clampTitle(wrapByCharacters(normalized, OTHER_LINE_LIMIT));
}

function createOverlaySvg(title: string) {
	const lines = wrapTitle(title);
	const fontSize = lines.length === 1 ? 68 : lines.length === 2 ? 58 : 50;
	const lineHeight = fontSize + 16;
	const titleBlockHeight = lines.length * lineHeight;
	const startY = OG_HEIGHT - 112 - titleBlockHeight;
	const text = lines
		.map((line, index) => {
			const y = startY + index * lineHeight;
			return `<text x="108" y="${y}" fill="#f8fbff" font-size="${fontSize}" font-weight="700" letter-spacing="-0.02em" font-family="'Noto Sans JP','Hiragino Sans','Yu Gothic',sans-serif">${escapeXml(line)}</text>`;
		})
		.join('');

	return `
		<svg width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}" fill="none" xmlns="http://www.w3.org/2000/svg">
			<defs>
				<linearGradient id="pageFade" x1="0" y1="0" x2="0" y2="${OG_HEIGHT}" gradientUnits="userSpaceOnUse">
					<stop offset="0" stop-color="rgba(6, 11, 20, 0.08)" />
					<stop offset="0.48" stop-color="rgba(6, 11, 20, 0.18)" />
					<stop offset="1" stop-color="rgba(6, 11, 20, 0.82)" />
				</linearGradient>
				<radialGradient id="titleGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(280 500) rotate(-17.5) scale(740 260)">
					<stop stop-color="rgba(37, 99, 235, 0.28)" />
					<stop offset="1" stop-color="rgba(37, 99, 235, 0)" />
				</radialGradient>
				<filter id="textShadow" x="-20%" y="-20%" width="140%" height="140%">
					<feDropShadow dx="0" dy="8" stdDeviation="20" flood-color="rgba(5, 10, 20, 0.45)" />
				</filter>
			</defs>
			<rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#pageFade)" />
			<rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#titleGlow)" />
			<rect x="72" y="72" width="398" height="52" rx="26" fill="rgba(8, 15, 32, 0.48)" stroke="rgba(255, 255, 255, 0.16)" />
			<text x="98" y="105" fill="#f8fbff" font-size="24" font-weight="600" letter-spacing="-0.02em" font-family="'Noto Sans JP','Hiragino Sans','Yu Gothic',sans-serif">AI-Agent Friendly EcoSystem</text>
			<rect x="74" y="${startY - 54}" width="8" height="${titleBlockHeight + 22}" rx="4" fill="#7cc6ff" />
			<rect x="54" y="${startY - 86}" width="1010" height="${titleBlockHeight + 122}" rx="36" fill="rgba(7, 14, 28, 0.36)" />
			<g filter="url(#textShadow)">
			${text}
			</g>
		</svg>
	`.trim();
}

export const GET: APIRoute = async ({ props }) => {
	const background = await readFile(backgroundPath);
	const title =
		typeof props.title === 'string'
			? props.title
			: 'AI-Agent Friendly EcoSystem';
	const overlay = createOverlaySvg(title);

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
