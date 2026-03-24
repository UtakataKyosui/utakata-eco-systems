import { spawnSync } from 'node:child_process';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';

type LoadedImage = {
	label: string;
	width: number;
	height: number;
};

type ReportImage = LoadedImage & {
	url: string;
};

type FocusArea = {
	id: string;
	label: string;
	x: number;
	y: number;
	width: number;
	height: number;
	panelWidth: number;
};

const rootDir = process.cwd();
const ogDir = path.join(rootDir, 'dist', 'og');
const outputDir = path.join(rootDir, 'artifacts', 'og-check');
const ogWidth = 1200;
const ogHeight = 630;
const focusAreas: FocusArea[] = [
	{
		id: 'title',
		label: 'Title Focus',
		x: 120,
		y: 120,
		width: 960,
		height: 220,
		panelWidth: 760,
	},
	{
		id: 'description',
		label: 'Description Focus',
		x: 140,
		y: 360,
		width: 920,
		height: 112,
		panelWidth: 760,
	},
];

function resolveChromePath(): string {
	const candidates = [process.env.CHROME_PATH, process.env.GOOGLE_CHROME_BIN];

	for (const candidate of candidates) {
		if (candidate) {
			return candidate;
		}
	}

	const result = spawnSync('which', ['google-chrome'], { encoding: 'utf8' });
	return result.status === 0 ? result.stdout.trim() : '';
}

async function collectPngFiles(directory: string): Promise<string[]> {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = await Promise.all(
		entries.map(async (entry) => {
			const fullPath = path.join(directory, entry.name);
			if (entry.isDirectory()) {
				return collectPngFiles(fullPath);
			}

			return entry.isFile() && entry.name.endsWith('.png') ? [fullPath] : [];
		})
	);

	return files.flat().sort((left, right) => left.localeCompare(right));
}

function createReportHtml(images: ReportImage[]): string {
	const cards = images
		.map((image) => {
			const focusPanels = focusAreas
				.map((area) => {
					const scale = area.panelWidth / area.width;
					const panelHeight = Math.round(area.height * scale);
					return `
						<section class="focus-card">
							<p class="focus-label">${area.label}</p>
							<div
								class="focus-frame"
								style="width:${area.panelWidth}px;height:${panelHeight}px;"
							>
								<img
									src="${image.url}"
									alt="${image.label} ${area.label}"
									style="
										width:${Math.round(ogWidth * scale)}px;
										height:${Math.round(ogHeight * scale)}px;
										transform: translate(${-Math.round(area.x * scale)}px, ${-Math.round(area.y * scale)}px);
									"
								/>
							</div>
						</section>
					`;
				})
				.join('');

			return `
				<section class="card" data-og-card>
					<div class="meta">
						<p class="label">${image.label}</p>
						<p class="size">${image.width} x ${image.height}</p>
					</div>
					<div class="frame">
						<img src="${image.url}" alt="${image.label}" />
					</div>
					<div class="focus-grid">
						${focusPanels}
					</div>
				</section>
			`;
		})
		.join('');

	return `<!doctype html>
<html lang="ja">
	<head>
		<meta charset="utf-8" />
		<title>OG Check Report</title>
		<style>
			:root {
				color-scheme: dark;
				font-family: "Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif;
			}
			* {
				box-sizing: border-box;
			}
			body {
				margin: 0;
				padding: 40px;
				background:
					radial-gradient(circle at top right, rgba(59, 130, 246, 0.16), transparent 32%),
					linear-gradient(180deg, #020617 0%, #0f172a 100%);
				color: #e2e8f0;
			}
			main {
				max-width: 1520px;
				margin: 0 auto;
			}
			h1 {
				margin: 0 0 8px;
				font-size: 36px;
				letter-spacing: -0.03em;
			}
			p.description {
				margin: 0 0 28px;
				color: #94a3b8;
				font-size: 18px;
			}
			ul.checklist {
				margin: 0 0 32px;
				padding-left: 24px;
				color: #cbd5e1;
				font-size: 16px;
				line-height: 1.7;
			}
			.grid {
				display: grid;
				gap: 24px;
			}
			.card {
				padding: 20px;
				border: 1px solid rgba(148, 163, 184, 0.18);
				border-radius: 24px;
				background: rgba(15, 23, 42, 0.72);
				backdrop-filter: blur(20px);
				box-shadow: 0 20px 60px rgba(2, 6, 23, 0.28);
			}
			.meta {
				display: flex;
				align-items: baseline;
				justify-content: space-between;
				gap: 16px;
				margin-bottom: 16px;
			}
			.label {
				margin: 0;
				font-size: 20px;
				font-weight: 700;
				letter-spacing: -0.02em;
			}
			.size {
				margin: 0;
				color: #93c5fd;
				font-size: 14px;
				font-weight: 600;
			}
			.frame {
				padding: 24px;
				border-radius: 20px;
				background:
					linear-gradient(180deg, rgba(30, 41, 59, 0.96), rgba(15, 23, 42, 0.96));
				display: grid;
				place-items: center;
			}
			img {
				display: block;
				width: 100%;
				max-width: 1200px;
				height: auto;
				border-radius: 16px;
				box-shadow: 0 24px 80px rgba(15, 23, 42, 0.42);
			}
			.focus-grid {
				display: grid;
				grid-template-columns: repeat(3, minmax(0, 1fr));
				gap: 16px;
				margin-top: 18px;
			}
			.focus-card {
				min-width: 0;
			}
			.focus-label {
				margin: 0 0 8px;
				color: #cbd5e1;
				font-size: 13px;
				font-weight: 700;
				letter-spacing: 0.02em;
				text-transform: uppercase;
			}
			.focus-frame {
				position: relative;
				max-width: 100%;
				overflow: hidden;
				border-radius: 14px;
				border: 1px solid rgba(148, 163, 184, 0.2);
				background: linear-gradient(180deg, rgba(30, 41, 59, 0.96), rgba(15, 23, 42, 0.96));
			}
			.focus-frame img {
				max-width: none;
				height: auto;
				border-radius: 0;
				box-shadow: none;
			}
			@media (max-width: 1320px) {
				.focus-grid {
					grid-template-columns: 1fr;
				}
			}
		</style>
	</head>
	<body>
		<main>
			<h1>OG Check Report</h1>
			<p class="description">dist/og 配下の生成済みOG画像を、ブラウザ上で確認しやすい形で並べています。</p>
			<ul class="checklist">
				<li>タイトルが背景に埋もれず、縮小表示でも読めるか</li>
				<li>説明文のコントラストが十分で、行間が詰まって見えないか</li>
				<li>文字の欠け、にじみ、ぼやけがないか</li>
			</ul>
			<div class="grid">${cards}</div>
		</main>
	</body>
</html>`;
}

const chromePath = resolveChromePath();

if (!chromePath) {
	throw new Error(
		'Google Chrome was not found. Set CHROME_PATH or GOOGLE_CHROME_BIN before running this script.'
	);
}

const pngFiles = await collectPngFiles(ogDir);

if (pngFiles.length === 0) {
	throw new Error(
		'No OG images found under dist/og. Run `pnpm run build` first.'
	);
}

await mkdir(outputDir, { recursive: true });

const images: ReportImage[] = pngFiles.map((filePath) => ({
	label: path.relative(rootDir, filePath),
	url: pathToFileURL(filePath).href,
	width: 1200,
	height: 630,
}));
const reportPath = path.join(outputDir, 'report.html');

await writeFile(reportPath, createReportHtml(images), 'utf8');

const browser = await chromium.launch({
	headless: true,
	executablePath: chromePath,
	args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage({
	viewport: { width: 1600, height: 2400 },
	deviceScaleFactor: 1,
});

await page.goto(pathToFileURL(reportPath).href);
await page.waitForFunction(() =>
	Array.from(document.images).every(
		(image) => image.complete && image.naturalWidth > 0
	)
);

const reportImagePath = path.join(outputDir, 'report.png');
await page.screenshot({ path: reportImagePath, fullPage: true });

const loadedImages = (await page
	.locator('[data-og-card]')
	.evaluateAll((cards) =>
		cards.map((card) => {
			const label = card.querySelector('.label')?.textContent ?? '';
			const image = card.querySelector('img');
			return {
				label,
				width: image?.naturalWidth ?? 0,
				height: image?.naturalHeight ?? 0,
			};
		})
	)) satisfies LoadedImage[];

await browser.close();

console.log(
	JSON.stringify(
		{
			reportPath,
			reportImagePath,
			images: loadedImages,
		},
		null,
		2
	)
);
