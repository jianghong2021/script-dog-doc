// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: {
				'zh-CN': '脚本狗',
				'en': 'Script Dog',
				'zh-TW': '腳本狗',
			},
			favicon: '/logo.png',
			defaultLocale: 'root',
			social: {
				github: 'https://github.com/withastro/starlight',
			},
			locales: {
				root: {
					label: '简体中文',
					lang: 'zh-CN',
				},
				en: {
					label: 'English',
					lang: 'en',
				},
				'zh-tw': {
					label: '繁體中文',
					lang: 'zh-TW',
				}
			},
			sidebar: [
				{
					label: 'Guides',
					
					translations:{
						'zh-CN': '指南',
						'en': 'Guides',
						'zh-TW': '指南',
					},
					items: [
						// Each item here is one entry in the navigation menu.
						{ 
							label: '快速开始',
							 slug: 'guides/start'
						 },
						{ 
							label: 'Example Guide',
							 slug: 'guides/example'
						 },
					],
				},
				{
					label: 'Reference',
					autogenerate: { directory: 'reference' },
				},
			],
		}),
	],
});
