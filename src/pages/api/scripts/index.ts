import type { APIRoute } from 'astro';
import { getSessionUser, SESSION_COOKIE } from '../../../lib/auth';
import { getThumbnails, listScripts } from '../../../lib/db';
import { createScript } from '../../../lib/scripts';
import { fail, getEnv, ok, parseCookies } from '../../../lib/utils';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
	const env = getEnv(locals);
	const url = new URL(request.url);
	const result = await listScripts(env, {
		q: url.searchParams.get('q') ?? undefined,
		type: url.searchParams.get('type') ?? undefined,
		sort: url.searchParams.get('sort') === 'downloads' ? 'downloads' : undefined,
		page: Number(url.searchParams.get('page') ?? '1') || 1,
		pageSize: Number(url.searchParams.get('pageSize') ?? '12') || 12,
	});

	const thumbs = await getThumbnails(
		env,
		result.items.map((item) => item.id)
	);

	const items = result.items.map((item) => {
		const { data_key, ...rest } = item;
		return { ...rest, thumb: thumbs.get(item.id)?.id ?? null };
	});

	return ok({ items, total: result.total, page: result.page, pageSize: result.pageSize });
};

export const POST: APIRoute = async ({ request, locals }) => {
	const env = getEnv(locals);

	let user = locals.user;
	if (!user) {
		const token = parseCookies(request.headers.get('cookie'))[SESSION_COOKIE];
		if (token) user = await getSessionUser(env, token);
	}
	if (!user) return fail('请先登录后再上传', 401);

	const result = await createScript(env, user.id, request);
	if (result.error) return fail(result.error, result.status ?? 400);
	return ok({ id: result.id }, { status: 201 });
};
