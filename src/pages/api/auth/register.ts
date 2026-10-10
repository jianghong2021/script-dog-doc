import type { APIRoute } from 'astro';
import { createSession, hashPassword } from '../../../lib/auth';
import { adminExists, isEmailTaken } from '../../../lib/db';
import {
	SESSION_COOKIE,
	SESSION_TTL,
	fail,
	getEnv,
	isValidEmail,
	normalizeEmail,
	ok,
	readBody,
	serializeCookie,
	uuid,
} from '../../../lib/utils';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
	const env = getEnv(locals);
	const body = await readBody(request);
	const email = normalizeEmail(body.email);
	const password = String(body.password ?? '');
	const nickname = String(body.nickname ?? '').trim();

	if (!isValidEmail(email)) return fail('请输入正确的邮箱地址');
	if (password.length < 6) return fail('密码至少 6 位');
	if (nickname.length > 30) return fail('昵称过长');
	if (await isEmailTaken(env, email)) return fail('该邮箱已注册', 409);

	const { hash, salt } = await hashPassword(password);
	const id = uuid();
	const matchesAdmin = Boolean(env.ADMIN_EMAIL && normalizeEmail(env.ADMIN_EMAIL) === email);
	const role = matchesAdmin && !(await adminExists(env)) ? 'admin' : 'user';

	await env.DB.prepare(
		'INSERT INTO users (id, email, password_hash, salt, nickname, role, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
	)
		.bind(id, email, hash, salt, nickname || email.split('@')[0], role, 'active', Date.now())
		.run();

	const { token } = await createSession(env, id);
	const headers = new Headers();
	headers.set('Set-Cookie', serializeCookie(SESSION_COOKIE, token, { maxAge: SESSION_TTL }));
	return ok({ id, email, nickname: nickname || email.split('@')[0], role }, { status: 201, headers });
};
