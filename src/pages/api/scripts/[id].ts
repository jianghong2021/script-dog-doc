import type { APIRoute } from 'astro';
import { getScript, getScriptImages } from '../../../lib/db';
import { deleteScriptData, deleteScriptImages, updateScript } from '../../../lib/scripts';
import { fail, getEnv, ok, readBody } from '../../../lib/utils';

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
	const env = getEnv(locals);
	const id = params.id!;
	const script = await getScript(env, id);
	if (!script) return fail('脚本不存在', 404);

	const isOwner = locals.user?.id === script.user_id;
	const isAdmin = locals.user?.role === 'admin';
	if (script.status !== 'published' && !isOwner && !isAdmin) {
		return fail('脚本不存在', 404);
	}

	const images = await getScriptImages(env, id);
	const { data_key, ...rest } = script;
	return ok({ ...rest, images });
};

export const DELETE: APIRoute = async ({ params, locals }) => {
	const env = getEnv(locals);
	const user = locals.user;
	if (!user) return fail('请先登录', 401);

	const id = params.id!;
	const script = await getScript(env, id);
	if (!script) return fail('脚本不存在', 404);
	if (script.user_id !== user.id && user.role !== 'admin') {
		return fail('无权限删除该脚本', 403);
	}

	await deleteScriptImages(env, id);
	await deleteScriptData(env, script.data_key);
	await env.DB.prepare('DELETE FROM scripts WHERE id = ?').bind(id).run();
	return ok({ id });
};

export const PATCH: APIRoute = async ({ params, locals, request }) => {
	const env = getEnv(locals);
	const user = locals.user;
	if (!user) return fail('请先登录', 401);

	const id = params.id!;
	const script = await getScript(env, id);
	if (!script) return fail('脚本不存在', 404);
	if (script.user_id !== user.id && user.role !== 'admin') {
		return fail('无权限操作该脚本', 403);
	}

	const body = await readBody(request);
	const status = body.status;
	if (!['published', 'offline'].includes(status)) return fail('状态参数不正确');

	await env.DB.prepare('UPDATE scripts SET status = ?, updated_at = ? WHERE id = ?')
		.bind(status, Date.now(), id)
		.run();
	return ok({ id, status });
};

export const PUT: APIRoute = async ({ params, locals, request }) => {
	const env = getEnv(locals);
	const user = locals.user;
	if (!user) return fail('请先登录', 401);

	const id = params.id!;
	const script = await getScript(env, id);
	if (!script) return fail('脚本不存在', 404);
	if (script.user_id !== user.id && user.role !== 'admin') {
		return fail('无权限操作该脚本', 403);
	}

	const result = await updateScript(env, script, request);
	if (result.error) return fail(result.error, result.status ?? 400);
	return ok({ id: result.id });
};
