import type { APIRoute } from 'astro';
import { listScripts } from '../../../../lib/db';
import { createScript } from '../../../../lib/scripts';
import { fail, getEnv, ok } from '../../../../lib/utils';

export const prerender = false;

export const GET: APIRoute = async ({ locals, url }) => {
	if (locals.user?.role !== 'admin') return fail('无权限', 403);
	const result = await listScripts(getEnv(locals), {
		q: url.searchParams.get('q') ?? undefined,
		type: url.searchParams.get('type') ?? undefined,
		status: 'all',
		page: Number(url.searchParams.get('page') ?? '1') || 1,
		pageSize: Number(url.searchParams.get('pageSize') ?? '20') || 20,
	});
	const items = result.items.map(({ data_key, ...rest }) => rest);
	return ok({ ...result, items });
};

export const POST: APIRoute = async ({ locals, request }) => {
	const admin = locals.user;
	if (admin?.role !== 'admin') return fail('无权限', 403);
	const result = await createScript(getEnv(locals), admin.id, request);
	if (result.error) return fail(result.error, result.status ?? 400);
	return ok({ id: result.id }, { status: 201 });
};
