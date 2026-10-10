import type { ProjectItem, ScriptRow } from './types';
import type { Env } from './utils';
import { parseTags, safeJsonParse, uuid } from './utils';

export const MAX_IMAGE_SIZE = 1024 * 1024; // 单张 1MB
export const MAX_IMAGES = 2;

const IMAGE_EXT: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp',
	'image/gif': 'gif',
	'image/avif': 'avif',
	'image/svg+xml': 'svg',
};

export interface ScriptMeta {
	name: string;
	description: string | null;
	author: string | null;
	version: string | null;
	scriptType: string | null;
	matches: string | null;
	icon: string | null;
}

export function parseProjectItem(text: string): ProjectItem | null {
	const item = safeJsonParse<ProjectItem>(text);
	if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
	if (typeof item.name !== 'string' || !item.name.trim()) return null;
	return item;
}

export function extractMeta(item: ProjectItem, overrides?: { description?: string; tags?: string[] }): ScriptMeta {
	const description =
		overrides?.description?.trim() ||
		(typeof item.description === 'string' ? item.description : '') ||
		null;
	return {
		name: item.name.trim().slice(0, 120),
		description: description ? description.slice(0, 2000) : null,
		author: typeof item.author === 'string' ? item.author.slice(0, 120) : null,
		version: typeof item.version === 'string' ? item.version.slice(0, 60) : null,
		scriptType: typeof item.type === 'string' ? item.type.slice(0, 40) : null,
		matches: Array.isArray(item.matches) ? JSON.stringify(item.matches) : null,
		icon: typeof item.icon === 'string' ? item.icon : null,
	};
}

export function validateImages(files: File[]): { files: File[]; error?: string } {
	const images = files.filter((file) => file && file.size > 0);
	if (images.length > MAX_IMAGES) {
		return { files: images, error: `最多上传 ${MAX_IMAGES} 张预览图片` };
	}
	for (const file of images) {
		if (!file.type.startsWith('image/')) {
			return { files: images, error: '预览图片格式不正确' };
		}
		if (file.size > MAX_IMAGE_SIZE) {
			return { files: images, error: `单张预览图片必须小于 1MB（${file.name}）` };
		}
	}
	return { files: images };
}

export async function saveImages(env: Env, scriptId: string, files: File[]): Promise<void> {
	let sort = 0;
	for (const file of files) {
		const imageId = uuid();
		const ext = IMAGE_EXT[file.type] || 'png';
		const r2Key = `scripts/${scriptId}/${imageId}.${ext}`;
		await env.IMAGES.put(r2Key, await file.arrayBuffer(), {
			httpMetadata: { contentType: file.type },
		});
		await env.DB.prepare(
			'INSERT INTO script_images (id, script_id, r2_key, content_type, size, sort, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
		)
			.bind(imageId, scriptId, r2Key, file.type, file.size, sort, Date.now())
			.run();
		sort += 1;
	}
}

export async function deleteScriptImages(env: Env, scriptId: string): Promise<void> {
	const rows = await env.DB.prepare('SELECT r2_key FROM script_images WHERE script_id = ?')
		.bind(scriptId)
		.all<{ r2_key: string }>();
	for (const row of rows.results ?? []) {
		await env.IMAGES.delete(row.r2_key).catch(() => undefined);
	}
	await env.DB.prepare('DELETE FROM script_images WHERE script_id = ?').bind(scriptId).run();
}

export interface CreateScriptResult {
	id?: string;
	error?: string;
	status?: number;
}

export async function createScript(env: Env, userId: string, request: Request): Promise<CreateScriptResult> {
	const form = await request.formData().catch(() => null);
	if (!form) return { error: '请求格式不正确', status: 400 };

	let raw = form.get('data');
	if (typeof raw !== 'string' || !raw.trim()) {
		const file = form.get('script');
		if (file instanceof File) raw = await file.text();
	}
	if (typeof raw !== 'string' || !raw.trim()) {
		return { error: '请提供脚本盒子导出的 JSON 文件', status: 400 };
	}

	const item = parseProjectItem(raw);
	if (!item) {
		return { error: '脚本 JSON 解析失败，请确认是脚本盒子导出的文件', status: 400 };
	}

	const descriptionRaw = form.get('description');
	const tags = parseTags(form.get('tags'));
	const imagesRaw = form.getAll('images').filter((value): value is File => value instanceof File);
	const { files, error } = validateImages(imagesRaw);
	if (error) return { error, status: 400 };

	const meta = extractMeta(item, {
		description: typeof descriptionRaw === 'string' ? descriptionRaw : undefined,
	});

	const id = uuid();
	const now = Date.now();
	const dataKey = `scripts/${id}/script.json`;
	await env.IMAGES.put(dataKey, raw, { httpMetadata: { contentType: 'application/json' } });

	await env.DB.prepare(
		`INSERT INTO scripts
		 (id, user_id, name, description, author, version, script_type, matches, tags, icon, data_key, status, downloads, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', 0, ?, ?)`
	)
		.bind(
			id,
			userId,
			meta.name,
			meta.description,
			meta.author,
			meta.version,
			meta.scriptType,
			meta.matches,
			JSON.stringify(tags),
			meta.icon,
			dataKey,
			now,
			now
		)
		.run();

	if (files.length) await saveImages(env, id, files);
	return { id };
}

export async function getScriptData(env: Env, dataKey: string): Promise<string | null> {
	if (!dataKey) return null;
	const object = await env.IMAGES.get(dataKey);
	return object ? object.text() : null;
}

export async function deleteScriptData(env: Env, dataKey: string): Promise<void> {
	if (!dataKey) return;
	await env.IMAGES.delete(dataKey).catch(() => undefined);
}

export async function updateScript(env: Env, script: ScriptRow, request: Request): Promise<CreateScriptResult> {
	const form = await request.formData().catch(() => null);
	if (!form) return { error: '请求格式不正确', status: 400 };

	let raw = form.get('data');
	if (typeof raw !== 'string' || !raw.trim()) {
		const file = form.get('script');
		if (file instanceof File) raw = await file.text();
	}
	if (typeof raw !== 'string' || !raw.trim()) {
		return { error: '请提供脚本盒子导出的 JSON 文件', status: 400 };
	}

	const item = parseProjectItem(raw);
	if (!item) {
		return { error: '脚本 JSON 解析失败，请确认是脚本盒子导出的文件', status: 400 };
	}

	const descriptionRaw = form.get('description');
	const tags = parseTags(form.get('tags'));
	const imagesRaw = form.getAll('images').filter((value): value is File => value instanceof File);
	const { files, error } = validateImages(imagesRaw);
	if (error) return { error, status: 400 };

	const meta = extractMeta(item, {
		description: typeof descriptionRaw === 'string' ? descriptionRaw : undefined,
	});

	const dataKey = script.data_key || `scripts/${script.id}/script.json`;
	await env.IMAGES.put(dataKey, raw, { httpMetadata: { contentType: 'application/json' } });

	await env.DB.prepare(
		`UPDATE scripts
		 SET name = ?, description = ?, author = ?, version = ?, script_type = ?, matches = ?, tags = ?, icon = ?, data_key = ?, updated_at = ?
		 WHERE id = ?`
	)
		.bind(
			meta.name,
			meta.description,
			meta.author,
			meta.version,
			meta.scriptType,
			meta.matches,
			JSON.stringify(tags),
			meta.icon,
			dataKey,
			Date.now(),
			script.id
		)
		.run();

	if (files.length) {
		await deleteScriptImages(env, script.id);
		await saveImages(env, script.id, files);
	}

	return { id: script.id };
}
