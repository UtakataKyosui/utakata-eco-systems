import { defineRouteMiddleware } from '@astrojs/starlight/route-data';

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

	route.head.push(
		{ tag: 'meta', attrs: { property: 'og:url', content: pageUrl } },
		{ tag: 'meta', attrs: { property: 'og:image', content: imageUrl } },
		{
			tag: 'meta',
			attrs: { property: 'og:image:alt', content: route.entry.data.title },
		},
		{
			tag: 'meta',
			attrs: { name: 'twitter:card', content: 'summary_large_image' },
		},
		{ tag: 'meta', attrs: { name: 'twitter:image', content: imageUrl } }
	);
});
