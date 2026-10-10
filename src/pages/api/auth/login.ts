import type { APIRoute } from 'astro';
import { createSession, verifyPassword } from '../../../lib/auth';
import type { UserRow } from '../../../lib/types';
import {
	SESSION_COOKIE,
	SESSION_TTL,
	fail,
	getEnv,
	normalizeEmail,
	ok,
	readBody,
	serializeCookie,
} from '../../../lib/utils';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
	const env = getEnv(locals);
	const body = await readBody(request);
	const email = normalizeEmail(body.email);
	const password = String(body.password ?? '');

	if (!email || !password) return fail('请输入邮箱和密码');

	const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?')
		.bind(email)
		.first<UserRow & { password_hash: string; salt: string }>();
	if (!user) return fail('邮箱或密码错误', 401);
	if (user.status === 'disabled') return fail('账号已被禁用', 403);

	const valid = await verifyPassword(password, user.salt, user.password_hash);
	if (!valid) return fail('邮箱或密码错误', 401);

	const { token } = await createSession(env, user.id);
	const headers = new Headers();
	headers.set('Set-Cookie', serializeCookie(SESSION_COOKIE, token, { maxAge: SESSION_TTL }));
	return ok({ id: user.id, email: user.email, nickname: user.nickname, role: user.role }, { headers });
};
