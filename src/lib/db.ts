import type { Env } from './utils';
import type { ScriptImageRow, ScriptRow, ScriptStatus, UserRow } from './types';

export type ScriptSort = 'latest' | 'downloads';

export interface ListScriptsOptions {
	q?: string;
	type?: string;
	status?: ScriptStatus | 'all';
	userId?: string;
	sort?: ScriptSort;
	page?: number;
	pageSize?: number;
}

export interface ScriptListResult {
	items: ScriptRow[];
	total: number;
	page: number;
	pageSize: number;
}

const SORT_SQL: Record<ScriptSort, string> = {
	latest: 'created_at DESC',
	downloads: 'downloads DESC, created_at DESC',
};

function escapeLike(value: string): string {
	return value.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

export async function listScripts(env: Env, options: ListScriptsOptions = {}): Promise<ScriptListResult> {
	const requestedPage = Math.max(1, options.page ?? 1);
	const pageSize = Math.min(48, Math.max(1, options.pageSize ?? 12));
	const where: string[] = [];
	const params: unknown[] = [];

	const status = options.status ?? 'published';
	if (status !== 'all') {
		where.push('status = ?');
		params.push(status);
	}
	if (options.q) {
		where.push(
			"(name LIKE ? ESCAPE '\\' OR author LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\' OR tags LIKE ? ESCAPE '\\')"
		);
		const like = `%${escapeLike(options.q)}%`;
		params.push(like, like, like, like);
	}
	if (options.type) {
		where.push('script_type = ?');
		params.push(options.type);
	}
	if (options.userId) {
		where.push('user_id = ?');
		params.push(options.userId);
	}

	const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
	const orderSql = SORT_SQL[options.sort ?? 'latest'];

	const totalRow = await env.DB.prepare(`SELECT COUNT(*) AS total FROM scripts ${whereSql}`)
		.bind(...params)
		.first<{ total: number }>();
	const total = totalRow?.total ?? 0;

	const totalPages = Math.max(1, Math.ceil(total / pageSize));
	const page = Math.min(requestedPage, totalPages);

	const items = await env.DB.prepare(
		`SELECT * FROM scripts ${whereSql} ORDER BY ${orderSql} LIMIT ? OFFSET ?`
	)
		.bind(...params, pageSize, (page - 1) * pageSize)
		.all<ScriptRow>();

	return { items: items.results ?? [], total, page, pageSize };
}

export async function getScript(env: Env, id: string): Promise<ScriptRow | null> {
	return (
		(await env.DB.prepare('SELECT * FROM scripts WHERE id = ?').bind(id).first<ScriptRow>()) ?? null
	);
}

export async function getScriptImages(env: Env, scriptId: string): Promise<ScriptImageRow[]> {
	const result = await env.DB.prepare(
		'SELECT * FROM script_images WHERE script_id = ? ORDER BY sort ASC'
	)
		.bind(scriptId)
		.all<ScriptImageRow>();
	return result.results ?? [];
}

export async function getThumbnails(env: Env, scriptIds: string[]): Promise<Map<string, ScriptImageRow>> {
	const map = new Map<string, ScriptImageRow>();
	if (scriptIds.length === 0) return map;
	const placeholders = scriptIds.map(() => '?').join(',');
	const result = await env.DB.prepare(
		`SELECT * FROM script_images WHERE script_id IN (${placeholders}) ORDER BY sort ASC`
	)
		.bind(...scriptIds)
		.all<ScriptImageRow>();
	for (const image of result.results ?? []) {
		if (!map.has(image.script_id)) map.set(image.script_id, image);
	}
	return map;
}

export interface ListUsersResult {
	items: UserRow[];
	total: number;
	page: number;
	pageSize: number;
}

export async function listUsers(env: Env, options: { q?: string; page?: number; pageSize?: number } = {}): Promise<ListUsersResult> {
	const page = Math.max(1, options.page ?? 1);
	const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 20));
	const where: string[] = [];
	const params: unknown[] = [];
	if (options.q) {
		where.push('email LIKE ?');
		params.push(`%${options.q}%`);
	}
	const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

	const totalRow = await env.DB.prepare(`SELECT COUNT(*) AS total FROM users ${whereSql}`)
		.bind(...params)
		.first<{ total: number }>();
	const total = totalRow?.total ?? 0;

	const items = await env.DB.prepare(
		`SELECT id, email, nickname, role, status, created_at FROM users ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`
	)
		.bind(...params, pageSize, (page - 1) * pageSize)
		.all<UserRow>();

	return { items: items.results ?? [], total, page, pageSize };
}

export async function isEmailTaken(env: Env, email: string): Promise<boolean> {
	const row = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first<{ id: string }>();
	return Boolean(row);
}

export async function adminExists(env: Env): Promise<boolean> {
	const row = await env.DB.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").first<{ id: string }>();
	return Boolean(row);
}
