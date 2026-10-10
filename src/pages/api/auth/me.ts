import type { APIRoute } from 'astro';
import { ok } from '../../../lib/utils';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
	return ok(locals.user ?? null);
};
