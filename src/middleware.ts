import { defineMiddleware } from 'astro:middleware';
import { getSessionUser } from './lib/auth';
import { parseCookies, SESSION_COOKIE } from './lib/utils';

const ADMIN_PREFIX = '/admin';
const LOGIN_REQUIRED = ['/upload', '/my-scripts'];

export const onRequest = defineMiddleware(async (context, next) => {
	const env = context.locals.runtime?.env;

	let user = null;
	if (env && !context.isPrerendered) {
		const cookies = parseCookies(context.request.headers.get('cookie'));
		const token = cookies[SESSION_COOKIE];
		if (token) {
			user = await getSessionUser(env, token).catch(() => null);
		}
	}
	context.locals.user = user;

	const path = context.url.pathname;
	const isAdminRoute = path === ADMIN_PREFIX || path.startsWith(`${ADMIN_PREFIX}/`);
	const needsLogin = isAdminRoute || LOGIN_REQUIRED.includes(path);

	if (needsLogin && !user) {
		const redirect = encodeURIComponent(context.url.pathname + context.url.search);
		return context.redirect(`/login?redirect=${redirect}`);
	}
	if (isAdminRoute && user?.role !== 'admin') {
		return new Response('无访问权限', { status: 403 });
	}

	return next();
});
