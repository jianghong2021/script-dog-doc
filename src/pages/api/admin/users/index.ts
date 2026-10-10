import type { APIRoute } from 'astro';
import { listUsers } from '../../../../lib/db';
import { fail, getEnv, ok } from '../../../../lib/utils';

export const prerender = false;

export const GET: APIRoute = async ({ locals, url }) => {
	if (locals.user?.role !== 'admin') return fail('无权限', 403);
	const result = await listUsers(getEnv(locals), {
		q: url.searchParams.get('q') ?? undefined,
		page: Number(url.searchParams.get('page') ?? '1') || 1,
		pageSize: Number(url.searchParams.get('pageSize') ?? '20') || 20,
	});
	return ok(result);
};
