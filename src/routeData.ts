import { defineRouteMiddleware } from '@astrojs/starlight/route-data';

export const onRequest = defineRouteMiddleware((context) => {
	const route = context.locals.starlightRoute;

	if (!route.entry || !route.id) {
		return;
	}

	const imageUrl = new URL(`/og/${route.id}.png`, context.url).toString();

	route.head.push(
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
