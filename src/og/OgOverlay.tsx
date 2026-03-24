/** @jsxRuntime automatic */
/** @jsxImportSource react */

type OgOverlayProps = {
	backgroundSrc: string;
	description: string;
	domain: string;
	lines: string[];
};

const WIDTH = 1200;
const HEIGHT = 630;
const FONT_FAMILY = 'Og Sans';
const TITLE_MAX_LINES = 3;
const ENGLISH_LINE_LIMIT = 22;
const OTHER_LINE_LIMIT = 13;
const DEFAULT_DESCRIPTION =
	'AIエージェント時代の実装前提と設計判断をまとめたドキュメント';
const DEFAULT_DOMAIN = 'utakata-eco-systems-docs.pages.dev';

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

export function getOgOverlayProps({
	title,
	backgroundSrc,
	description = DEFAULT_DESCRIPTION,
	domain = DEFAULT_DOMAIN,
}: {
	title: string;
	backgroundSrc: string;
	description?: string;
	domain?: string;
}): OgOverlayProps {
	return {
		backgroundSrc,
		description,
		domain,
		lines: wrapTitle(title),
	};
}

export function OgOverlay({
	backgroundSrc,
	description,
	domain,
	lines,
}: OgOverlayProps) {
	const fontSize = lines.length === 1 ? 74 : lines.length === 2 ? 64 : 56;
	const lineHeight = fontSize + 18;
	const titleBlockHeight = lines.length * lineHeight;
	const titleTopY = 164;
	const plateX = 120;
	const plateY = 40;
	const plateWidth = 960;
	const plateHeight = (plateWidth * HEIGHT) / WIDTH;
	const descriptionY = titleTopY + titleBlockHeight + 92;

	return (
		<div
			style={{
				position: 'relative',
				display: 'flex',
				width: WIDTH,
				height: HEIGHT,
				overflow: 'hidden',
				backgroundColor: '#f8fbff',
				fontFamily: FONT_FAMILY,
			}}
		>
			<img
				src={backgroundSrc}
				alt=""
				width={WIDTH}
				height={HEIGHT}
				style={{
					position: 'absolute',
					inset: 0,
					width: WIDTH,
					height: HEIGHT,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					display: 'flex',
					background:
						'linear-gradient(135deg, rgba(248, 251, 255, 0.82) 0%, rgba(243, 248, 255, 0.72) 52%, rgba(239, 246, 255, 0.8) 100%)',
				}}
			/>
			<div
				style={{
					position: 'absolute',
					left: 120,
					top: 324,
					width: 420,
					height: 220,
					display: 'flex',
					borderRadius: 999,
					backgroundColor: 'rgba(59, 130, 246, 0.05)',
				}}
			/>
			<div
				style={{
					position: 'absolute',
					right: -36,
					top: -48,
					width: 520,
					height: 280,
					display: 'flex',
					borderRadius: 999,
					backgroundColor: 'rgba(147, 197, 253, 0.16)',
				}}
			/>
			<div
				style={{
					position: 'absolute',
					left: plateX,
					top: plateY,
					width: plateWidth,
					height: plateHeight,
					display: 'flex',
					borderRadius: 32,
					background:
						'linear-gradient(135deg, rgba(255, 255, 255, 0.56) 0%, rgba(255, 255, 255, 0.34) 100%)',
					border: '1px solid rgba(255, 255, 255, 0.18)',
				}}
			/>
			<div
				style={{
					position: 'absolute',
					left: 160,
					right: 160,
					top: titleTopY,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'flex-start',
					textAlign: 'center',
					color: '#0f172a',
				}}
			>
				{lines.map((line) => (
					<div
						key={line}
						style={{
							display: 'flex',
							fontSize,
							fontWeight: 700,
							lineHeight: `${lineHeight}px`,
							letterSpacing: '-0.03em',
						}}
					>
						{line}
					</div>
				))}
			</div>
			<div
				style={{
					position: 'absolute',
					left: 140,
					right: 140,
					top: descriptionY,
					display: 'flex',
					justifyContent: 'center',
					color: '#475569',
					fontSize: 28,
					fontWeight: 500,
					letterSpacing: '-0.02em',
					textAlign: 'center',
				}}
			>
				{description}
			</div>
			<div
				style={{
					position: 'absolute',
					left: 36,
					bottom: 12,
					display: 'flex',
					color: '#64748b',
					fontSize: 24,
					fontWeight: 600,
					letterSpacing: '-0.02em',
				}}
			>
				{domain}
			</div>
		</div>
	);
}
