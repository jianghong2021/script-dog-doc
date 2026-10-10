export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'disabled';
export type ScriptStatus = 'published' | 'offline';

export interface UserRow {
	id: string;
	email: string;
	nickname: string | null;
	role: UserRole;
	status: UserStatus;
	created_at: number;
}

export interface SessionUser {
	id: string;
	email: string;
	nickname: string | null;
	role: UserRole;
}

export interface ScriptRow {
	id: string;
	user_id: string;
	name: string;
	description: string | null;
	author: string | null;
	version: string | null;
	script_type: string | null;
	matches: string | null;
	tags: string | null;
	icon: string | null;
	data_key: string;
	status: ScriptStatus;
	downloads: number;
	created_at: number;
	updated_at: number;
}

export interface ScriptImageRow {
	id: string;
	script_id: string;
	r2_key: string;
	content_type: string | null;
	size: number | null;
	sort: number;
	created_at: number;
}

export interface ProjectItem {
	id?: string;
	name: string;
	description?: string;
	author?: string;
	version?: string;
	type?: string;
	matches?: string[];
	exclude?: string[];
	include?: string[];
	code?: string;
	source?: string;
	templates?: Record<string, string>;
	icon?: string;
	runAt?: string;
	requires?: string[];
	resources?: string[];
	useDog?: boolean;
	useGM?: boolean;
	programmingType?: string;
	external?: boolean;
	[key: string]: unknown;
}
