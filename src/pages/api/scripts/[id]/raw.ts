import type { APIRoute } from 'astro';
import { getScript } from '../../../../lib/db';
import { getEnv } from '../../../../lib/utils';

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
	const env = getEnv(locals);
	const id = params.id!;
	const script = await getScript(env, id);
	if (!script) return new Response('Not Found', { status: 404 });

	const isOwner = locals.user?.id === script.user_id;
	const isAdmin = locals.user?.role === 'admin';
	if (script.status !== 'published' && !isOwner && !isAdmin) {
		return new Response('Not Found', { status: 404 });
	}

	const object = await env.IMAGES.get(script.data_key);
	if (!object) return new Response('Not Found', { status: 404 });

	await env.DB.prepare('UPDATE scripts SET downloads = downloads + 1 WHERE id = ?').bind(id).run();

	return new Response(object.body as unknown as BodyInit, {
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Cache-Control': 'no-store',
			'Content-Disposition': `attachment; filename="${encodeURIComponent(script.name)}.json"`,
		},
	});
};
