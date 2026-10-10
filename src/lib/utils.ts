import type { D1Database, Fetcher, R2Bucket } from '@cloudflare/workers-types';

export const SESSION_COOKIE = 'sd_session';
export const SESSION_TTL = 1000 * 60 * 60 * 24 * 30; // 30 天

export interface Env {
	DB: D1Database;
	IMAGES: R2Bucket;
	ASSETS: Fetcher;
	ADMIN_EMAIL?: string;
}

export function json(data: unknown, init: ResponseInit = {}): Response {
	const headers = new Headers(init.headers);
	headers.set('Content-Type', 'application/json; charset=utf-8');
	return new Response(JSON.stringify(data), { ...init, headers });
}

export function fail(message: string, status = 400): Response {
	return json({ ok: false, message }, { status });
}

export function ok<T>(data: T, init: ResponseInit = {}): Response {
	return json({ ok: true, data }, init);
}

export function uuid(): string {
	return crypto.randomUUID();
}

export function parseCookies(header: string | null): Record<string, string> {
	const result: Record<string, string> = {};
	if (!header) return result;
	for (const part of header.split(';')) {
		const idx = part.indexOf('=');
		if (idx === -1) continue;
		const key = part.slice(0, idx).trim();
		const value = part.slice(idx + 1).trim();
		if (key) result[key] = decodeURIComponent(value);
	}
	return result;
}

export function serializeCookie(
	name: string,
	value: string,
	options: { maxAge?: number; path?: string } = {}
): string {
	const path = options.path ?? '/';
	let cookie = `${name}=${encodeURIComponent(value)}; Path=${path}; HttpOnly; Secure; SameSite=Lax`;
	if (typeof options.maxAge === 'number') cookie += `; Max-Age=${Math.floor(options.maxAge / 1000)}`;
	return cookie;
}

export function clearCookie(name: string): string {
	return `${name}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function getEnv(locals: { runtime?: { env?: Partial<Env> } } | null | undefined): Env {
	const env = locals?.runtime?.env as Env | undefined;
	if (!env || !env.DB) {
		throw new Error(
			'Cloudflare 绑定未注入（缺少 DB）：请确认在项目根目录运行 `npm run dev`、wrangler.jsonc 存在，并已执行 `npm run db:init:local`'
		);
	}
	return env;
}

export function normalizeEmail(email: unknown): string {
	return String(email ?? '').trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function toBase64(bytes: Uint8Array): string {
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary);
}

export function fromBase64(value: string): Uint8Array {
	const binary = atob(value);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
}

export function timingSafeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let result = 0;
	for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
	return result === 0;
}

export function parseTags(input: unknown): string[] {
	if (Array.isArray(input)) {
		return input.map((t) => String(t).trim()).filter(Boolean).slice(0, 10);
	}
	return String(input ?? '')
		.split(/[,，\s]+/)
		.map((t) => t.trim())
		.filter(Boolean)
		.slice(0, 10);
}

export async function readBody(request: Request): Promise<Record<string, string>> {
	const contentType = request.headers.get('content-type') ?? '';
	const result: Record<string, string> = {};
	if (contentType.includes('application/json')) {
		const data = (await request.json().catch(() => ({}))) as Record<string, unknown>;
		for (const [key, value] of Object.entries(data ?? {})) result[key] = String(value ?? '');
	} else {
		const form = await request.formData().catch(() => null);
		if (form) {
			for (const [key, value] of form.entries()) {
				if (typeof value === 'string') result[key] = value;
			}
		}
	}
	return result;
}

export function safeJsonParse<T>(text: string): T | null {
	try {
		return JSON.parse(text) as T;
	} catch {
		return null;
	}
}
