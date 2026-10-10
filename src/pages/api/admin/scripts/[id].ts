import type { APIRoute } from 'astro';
import { fail, getEnv, ok, readBody } from '../../../../lib/utils';

export const prerender = false;

export const PATCH: APIRoute = async ({ params, locals, request }) => {
	const env = getEnv(locals);
	if (locals.user?.role !== 'admin') return fail('无权限', 403);

	const id = params.id!;
	const body = await readBody(request);
	const status = body.status;
	if (!['published', 'offline'].includes(status)) return fail('状态参数不正确');

	const result = await env.DB.prepare('UPDATE scripts SET status = ?, updated_at = ? WHERE id = ?')
		.bind(status, Date.now(), id)
		.run();
	if (!result.meta.changes) return fail('脚本不存在', 404);
	return ok({ id, status });
};
