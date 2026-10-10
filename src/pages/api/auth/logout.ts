import type { APIRoute } from 'astro';
import { deleteSession } from '../../../lib/auth';
import { SESSION_COOKIE, clearCookie, getEnv, parseCookies } from '../../../lib/utils';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
	const env = getEnv(locals);
	const cookies = parseCookies(request.headers.get('cookie'));
	const token = cookies[SESSION_COOKIE];
	if (token) await deleteSession(env, token).catch(() => undefined);

	const headers = new Headers();
	headers.set('Set-Cookie', clearCookie(SESSION_COOKIE));
	headers.set('Location', '/');
	return new Response(null, { status: 303, headers });
};
