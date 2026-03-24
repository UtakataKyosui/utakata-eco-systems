import { defineRouteMiddleware } from '@astrojs/starlight/route-data';

const OG_IMAGE_WIDTH = '1200';
const OG_IMAGE_HEIGHT = '630';

export const onRequest = defineRouteMiddleware((context) => {
	const route = context.locals.starlightRoute;
	const slug =
		route.id ||
		route.entry?.id ||
		(context.url.pathname === '/' ? 'index' : undefined);

	if (!route.entry || !slug) {
		return;
	}

	if (!context.site) {
		return;
	}

	const pageUrl = new URL(context.url.pathname, context.site).toString();
	const imageUrl = new URL(`/og/${slug}.png`, context.site).toString();
	const title = route.entry.data.title;
	const description = route.entry.data.description;

	route.head.push(
		{ tag: 'meta', attrs: { property: 'og:url', content: pageUrl } },
		{ tag: 'meta', attrs: { property: 'og:image', content: imageUrl } },
		{
			tag: 'meta',
			attrs: { property: 'og:image:secure_url', content: imageUrl },
		},
		{ tag: 'meta', attrs: { property: 'og:image:type', content: 'image/png' } },
		{
			tag: 'meta',
			attrs: { property: 'og:image:width', content: OG_IMAGE_WIDTH },
		},
		{
			tag: 'meta',
			attrs: { property: 'og:image:height', content: OG_IMAGE_HEIGHT },
		},
		{
			tag: 'meta',
			attrs: { property: 'og:image:alt', content: title },
		},
		{
			tag: 'meta',
			attrs: { name: 'twitter:card', content: 'summary_large_image' },
		},
		{ tag: 'meta', attrs: { name: 'twitter:title', content: title } },
		...(description
			? [
					{
						tag: 'meta',
						attrs: { name: 'twitter:description', content: description },
					},
				]
			: []),
		{ tag: 'meta', attrs: { name: 'twitter:image', content: imageUrl } },
		{ tag: 'meta', attrs: { name: 'twitter:image:alt', content: title } }
	);
});
