import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { OgOverlay } from './OgOverlay';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

const TITLE_MAX_LINES = 3;
const ENGLISH_LINE_LIMIT = 22;
const OTHER_LINE_LIMIT = 13;
const OG_DESCRIPTION =
	'AIエージェント時代の実装前提と設計判断をまとめたドキュメント';
const OG_DOMAIN = 'utakata-eco-systems-docs.pages.dev';

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

export function renderOgOverlaySvg(title: string) {
	return renderToStaticMarkup(
		createElement(OgOverlay, {
			description: OG_DESCRIPTION,
			domain: OG_DOMAIN,
			lines: wrapTitle(title),
		})
	);
}
