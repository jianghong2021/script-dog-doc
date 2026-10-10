import type { APIRoute } from 'astro';
import { deleteUserSessions } from '../../../../lib/auth';
import { fail, getEnv, ok, readBody } from '../../../../lib/utils';

export const prerender = false;

export const PATCH: APIRoute = async ({ params, locals, request }) => {
	const env = getEnv(locals);
	const admin = locals.user;
	if (admin?.role !== 'admin') return fail('无权限', 403);

	const id = params.id!;
	const target = await env.DB.prepare('SELECT id, role, status FROM users WHERE id = ?')
		.bind(id)
		.first<{ id: string; role: string; status: string }>();
	if (!target) return fail('用户不存在', 404);
	if (target.role === 'admin') return fail('管理员账号不可操作', 403);

	const body = await readBody(request);
	if (typeof body.status !== 'string' || !['active', 'disabled'].includes(body.status)) {
		return fail('状态参数不正确');
	}

	await env.DB.prepare('UPDATE users SET status = ? WHERE id = ?').bind(body.status, id).run();
	if (body.status === 'disabled') await deleteUserSessions(env, id);

	return ok({ id, status: body.status });
};
