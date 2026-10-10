import type { APIRoute } from 'astro';
import type { ScriptImageRow } from '../../../lib/types';
import { getEnv } from '../../../lib/utils';

export const prerender = false;

export const GET: APIRoute = async ({ params, locals, request }) => {
	const env = getEnv(locals);
	const id = params.id!;

	const image = await env.DB.prepare(
		`SELECT i.*, s.status AS script_status, s.user_id AS script_user_id
		 FROM script_images i JOIN scripts s ON s.id = i.script_id WHERE i.id = ?`
	)
		.bind(id)
		.first<ScriptImageRow & { script_status: string; script_user_id: string }>();
	if (!image) return new Response('Not Found', { status: 404 });

	const isOwner = locals.user?.id === image.script_user_id;
	const isAdmin = locals.user?.role === 'admin';
	if (image.script_status !== 'published' && !isOwner && !isAdmin) {
		return new Response('Not Found', { status: 404 });
	}

	const object = await env.IMAGES.get(image.r2_key);
	if (!object) return new Response('Not Found', { status: 404 });

	const headers = new Headers();
	headers.set('Content-Type', image.content_type || object.httpMetadata?.contentType || 'image/png');
	headers.set('Cache-Control', 'public, max-age=31536000, immutable');
	if (object.httpEtag) headers.set('ETag', object.httpEtag);

	if (request.headers.get('if-none-match') === object.httpEtag) {
		return new Response(null, { status: 304, headers });
	}

	return new Response(object.body as unknown as BodyInit, { headers });
};
