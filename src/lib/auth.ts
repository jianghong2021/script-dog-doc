import type { SessionUser } from './types';
import type { Env } from './utils';
import { SESSION_COOKIE, SESSION_TTL, fromBase64, toBase64, timingSafeEqual, uuid } from './utils';

const PBKDF2_ITERATIONS = 100_000;
const KEY_LENGTH_BITS = 256;

async function derive(password: string, salt: Uint8Array): Promise<Uint8Array> {
	const enc = new TextEncoder();
	const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
	const bits = await crypto.subtle.deriveBits(
		{ name: 'PBKDF2', salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
		key,
		KEY_LENGTH_BITS
	);
	return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const hash = await derive(password, salt);
	return { hash: toBase64(hash), salt: toBase64(salt) };
}

export async function verifyPassword(password: string, salt: string, hash: string): Promise<boolean> {
	const computed = toBase64(await derive(password, fromBase64(salt)));
	return timingSafeEqual(computed, hash);
}

export async function createSession(env: Env, userId: string): Promise<{ token: string; expiresAt: number }> {
	const token = uuid().replace(/-/g, '') + uuid().replace(/-/g, '');
	const now = Date.now();
	const expiresAt = now + SESSION_TTL;
	await env.DB.prepare('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
		.bind(token, userId, now, expiresAt)
		.run();
	return { token, expiresAt };
}

export async function getSessionUser(env: Env, token: string): Promise<SessionUser | null> {
	const row = await env.DB.prepare(
		`SELECT u.id, u.email, u.nickname, u.role
		 FROM sessions s
		 JOIN users u ON u.id = s.user_id
		 WHERE s.token = ? AND s.expires_at > ? AND u.status = 'active'`
	)
		.bind(token, Date.now())
		.first<SessionUser>();
	return row ?? null;
}

export async function deleteSession(env: Env, token: string): Promise<void> {
	await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
}

export async function deleteUserSessions(env: Env, userId: string): Promise<void> {
	await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId).run();
}

export { SESSION_COOKIE, SESSION_TTL };
