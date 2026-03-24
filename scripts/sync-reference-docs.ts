import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

type JsonObject = Record<string, unknown>;

type ParseMode = 'json' | 'text';

type GitHubRequestOptions = {
	accept?: string;
	parseAs?: ParseMode;
};

type RepositoryOwner = {
	login: string;
};

type Repository = {
	archived: boolean;
	default_branch: string;
	description: string | null;
	full_name: string;
	html_url: string;
	name: string;
	owner: RepositoryOwner;
	topics?: string[];
};

type TopicsResponse = {
	names: string[];
};

type SyncManifest = {
	generatedAt: string;
	generatedFiles: string[];
	owner: string;
	topic: string;
};

const topic = process.env.ECOSYSTEM_TOPIC ?? 'utakata-eco-system';
const outputDir = path.resolve(
	process.env.ECOSYSTEM_OUTPUT_DIR ?? 'src/content/docs/reference'
);
const manifestPath = path.join(outputDir, '.ecosystem-sync-manifest.json');
const apiBase = (
	process.env.GITHUB_API_URL ?? 'https://api.github.com'
).replace(/\/$/, '');
const token =
	process.env.ECOSYSTEM_SYNC_TOKEN ?? process.env.GITHUB_TOKEN ?? '';

function requireOwner(): string {
	const configuredOwner =
		process.env.ECOSYSTEM_OWNER ?? process.env.GITHUB_REPOSITORY_OWNER;

	if (!configuredOwner) {
		throw new Error('ECOSYSTEM_OWNER or GITHUB_REPOSITORY_OWNER must be set.');
	}

	return configuredOwner;
}

const owner = requireOwner();

function expectObject(value: unknown, context: string): JsonObject {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		throw new Error(`${context} must be an object.`);
	}

	return value as JsonObject;
}

function expectString(value: unknown, context: string): string {
	if (typeof value !== 'string') {
		throw new Error(`${context} must be a string.`);
	}

	return value;
}

function expectBoolean(value: unknown, context: string): boolean {
	if (typeof value !== 'boolean') {
		throw new Error(`${context} must be a boolean.`);
	}

	return value;
}

function expectStringArray(value: unknown, context: string): string[] {
	if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
		throw new Error(`${context} must be a string array.`);
	}

	return value;
}

function parseRepository(value: unknown, context: string): Repository {
	const object = expectObject(value, context);
	const ownerObject = expectObject(object.owner, `${context}.owner`);

	return {
		archived: expectBoolean(object.archived, `${context}.archived`),
		default_branch: expectString(
			object.default_branch,
			`${context}.default_branch`
		),
		description:
			object.description === null
				? null
				: expectString(object.description, `${context}.description`),
		full_name: expectString(object.full_name, `${context}.full_name`),
		html_url: expectString(object.html_url, `${context}.html_url`),
		name: expectString(object.name, `${context}.name`),
		owner: {
			login: expectString(ownerObject.login, `${context}.owner.login`),
		},
		topics:
			object.topics === undefined
				? undefined
				: expectStringArray(object.topics, `${context}.topics`),
	};
}

function parseRepositories(value: unknown, context: string): Repository[] {
	if (!Array.isArray(value)) {
		throw new Error(`${context} must be an array.`);
	}

	return value.map((repository, index) =>
		parseRepository(repository, `${context}[${index}]`)
	);
}

function parseTopicsResponse(value: unknown): TopicsResponse {
	const object = expectObject(value, 'topics response');

	return {
		names: expectStringArray(object.names, 'topics response.names'),
	};
}

function parseManifest(value: unknown): SyncManifest | null {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return null;
	}

	const object = value as JsonObject;
	if (
		!Array.isArray(object.generatedFiles) ||
		object.generatedFiles.some((item) => typeof item !== 'string')
	) {
		return null;
	}

	return {
		generatedAt:
			typeof object.generatedAt === 'string' ? object.generatedAt : '',
		generatedFiles: object.generatedFiles,
		owner: typeof object.owner === 'string' ? object.owner : '',
		topic: typeof object.topic === 'string' ? object.topic : '',
	};
}

async function githubRequest(
	resourcePath: string,
	options: GitHubRequestOptions = {}
): Promise<unknown> {
	const { accept = 'application/vnd.github+json', parseAs = 'json' } = options;
	const response = await fetch(`${apiBase}${resourcePath}`, {
		headers: {
			Accept: accept,
			Authorization: token ? `Bearer ${token}` : undefined,
			'User-Agent': 'utakata-eco-systems-doc-sync',
			'X-GitHub-Api-Version': '2022-11-28',
		},
	});

	if (!response.ok) {
		const detail = await response.text();
		throw new Error(
			`GitHub API request failed (${response.status} ${response.statusText}) for ${resourcePath}\n${detail}`
		);
	}

	return parseAs === 'text' ? response.text() : response.json();
}

async function listOwnedRepositories(): Promise<Repository[]> {
	const repositories: Repository[] = [];

	for (let page = 1; page <= 10; page += 1) {
		const query = new URLSearchParams({
			per_page: '100',
			page: String(page),
		});
		const resourcePath = token
			? `/user/repos?${query.toString()}&affiliation=owner&sort=updated&direction=desc`
			: `/users/${owner}/repos?${query.toString()}&type=owner&sort=updated&direction=desc`;
		const items = parseRepositories(
			await githubRequest(resourcePath),
			'repositories response'
		);

		repositories.push(...items);

		if (items.length < 100) {
			break;
		}
	}

	return repositories;
}

async function repositoryHasTopic(repository: Repository): Promise<boolean> {
	if (Array.isArray(repository.topics)) {
		return repository.topics.includes(topic);
	}

	const data = parseTopicsResponse(
		await githubRequest(`/repos/${repository.full_name}/topics`)
	);
	return data.names.includes(topic);
}

async function findRepositories(): Promise<Repository[]> {
	const repositories = await listOwnedRepositories();
	const filteredRepositories: Repository[] = [];
	const normalizedOwner = owner.toLowerCase();

	for (const repository of repositories) {
		if (
			repository.owner.login.toLowerCase() !== normalizedOwner ||
			repository.archived
		) {
			continue;
		}

		if (await repositoryHasTopic(repository)) {
			filteredRepositories.push(repository);
		}
	}

	return filteredRepositories.sort((left, right) =>
		left.name.localeCompare(right.name)
	);
}

async function getReadme(fullName: string): Promise<string | null> {
	try {
		const response = await githubRequest(`/repos/${fullName}/readme`, {
			accept: 'application/vnd.github.raw+json',
			parseAs: 'text',
		});
		return expectString(response, `README response for ${fullName}`);
	} catch (error) {
		if (error instanceof Error && error.message.includes('(404 ')) {
			return null;
		}

		throw error;
	}
}

function stripFrontmatter(content: string): string {
	const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
	if (!match || !match[1]?.includes(':')) {
		return content.trimStart();
	}

	return content.slice(match[0].length).trimStart();
}

function isRelativeReference(value: string): boolean {
	return !/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(value);
}

function normalizeReference(reference: string, baseUrl: string): string {
	const wrappedInAngles = reference.startsWith('<') && reference.endsWith('>');
	const rawValue = wrappedInAngles ? reference.slice(1, -1) : reference;

	if (!isRelativeReference(rawValue)) {
		return reference;
	}

	const normalizedValue = rawValue.replace(/^\/+/, '');
	const resolved = new URL(normalizedValue, baseUrl).toString();

	return wrappedInAngles ? `<${resolved}>` : resolved;
}

function rewriteRelativeReferences(
	content: string,
	repository: Repository
): string {
	const blobBaseUrl = `${repository.html_url}/blob/${repository.default_branch}/`;
	const rawBaseUrl = `https://raw.githubusercontent.com/${repository.full_name}/${repository.default_branch}/`;

	const replaceMarkdownReference = (
		_prefixMatch: string,
		prefix: string,
		target: string,
		suffix: string,
		baseUrl: string
	) => {
		return `${prefix}${normalizeReference(target, baseUrl)}${suffix}`;
	};

	return content
		.replace(
			/(!\[[^\]]*]\()([^) \t]+)([^)]*\))/g,
			(match, prefix, target, suffix) =>
				replaceMarkdownReference(match, prefix, target, suffix, rawBaseUrl)
		)
		.replace(
			/((?<!!)\[[^\]]*]\()([^) \t]+)([^)]*\))/g,
			(match, prefix, target, suffix) =>
				replaceMarkdownReference(match, prefix, target, suffix, blobBaseUrl)
		)
		.replace(
			/(<img\b[^>]*\bsrc=")([^"]+)(")/gi,
			(match, prefix, target, suffix) =>
				replaceMarkdownReference(match, prefix, target, suffix, rawBaseUrl)
		)
		.replace(
			/(<a\b[^>]*\bhref=")([^"]+)(")/gi,
			(match, prefix, target, suffix) =>
				replaceMarkdownReference(match, prefix, target, suffix, blobBaseUrl)
		);
}

function toOutputFileName(name: string, usedNames: Set<string>): string {
	const baseName =
		name
			.toLowerCase()
			.replace(/[^a-z0-9._-]+/g, '-')
			.replace(/^-+|-+$/g, '') || 'repo';
	let fileName = `${baseName}.md`;
	let index = 2;

	while (usedNames.has(fileName)) {
		fileName = `${baseName}-${index}.md`;
		index += 1;
	}

	usedNames.add(fileName);
	return fileName;
}

function buildDocument(repository: Repository, readmeContent: string): string {
	const title = JSON.stringify(repository.name);
	const description = JSON.stringify(repository.description ?? '');
	const source = repository.html_url;
	const body = rewriteRelativeReferences(
		stripFrontmatter(readmeContent),
		repository
	).trim();

	return `---\n${[`title: ${title}`, `description: ${description}`].join('\n')}\n---\n\n<!-- markdownlint-disable-file -->\n<!-- generated by scripts/sync-reference-docs.ts from ${source} -->\n\n${body}\n`;
}

async function loadPreviousManifest(): Promise<string[]> {
	try {
		const content = await readFile(manifestPath, 'utf8');
		const data = parseManifest(JSON.parse(content));
		return data?.generatedFiles ?? [];
	} catch {
		return [];
	}
}

async function main(): Promise<void> {
	await mkdir(outputDir, { recursive: true });

	const repositories = await findRepositories();
	const previousFiles = await loadPreviousManifest();
	const nextFiles: string[] = [];
	const usedNames = new Set<string>();

	console.log(
		`Found ${repositories.length} repositories for topic "${topic}".`
	);

	for (const repository of repositories) {
		const readmeContent = await getReadme(repository.full_name);
		if (!readmeContent) {
			console.warn(`Skipping ${repository.full_name}: README not found.`);
			continue;
		}

		const fileName = toOutputFileName(repository.name, usedNames);
		const absolutePath = path.join(outputDir, fileName);
		const document = buildDocument(repository, readmeContent);

		await writeFile(absolutePath, document, 'utf8');
		nextFiles.push(fileName);
		console.log(
			`Updated ${path.relative(process.cwd(), absolutePath)} from ${repository.full_name}.`
		);
	}

	for (const fileName of previousFiles) {
		if (nextFiles.includes(fileName)) {
			continue;
		}

		await rm(path.join(outputDir, fileName), { force: true });
		console.log(`Removed stale generated file: ${fileName}`);
	}

	const manifest: SyncManifest = {
		generatedAt: new Date().toISOString(),
		generatedFiles: nextFiles,
		owner,
		topic,
	};

	await writeFile(
		manifestPath,
		`${JSON.stringify(manifest, null, 2)}\n`,
		'utf8'
	);
}

main().catch((error: unknown) => {
	console.error(error);
	process.exitCode = 1;
});
