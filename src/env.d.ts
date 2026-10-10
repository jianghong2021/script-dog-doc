/// <reference types="astro/client" />

import type { Runtime } from '@astrojs/cloudflare';
import type { Env } from './lib/utils';
import type { SessionUser } from './lib/types';

declare global {
	namespace App {
		interface Locals extends Runtime<Env> {
			user: SessionUser | null;
		}
	}
}

export {};
