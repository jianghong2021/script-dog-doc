// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	base: '/script-dog-doc/',
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
				email: 'mailto:jianghong2020@qq.com?subject=咨询信息&body=您好，我想咨询一些产品信息。',
				telegram: 'https://t.me/jbg_dev',
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
					translations: {
						'zh-CN': '指南',
						'en': 'Guides',
						'zh-TW': '指南',
					},
					items: [
						{
							label: 'Examples',
							slug: 'guides/example',
							translations:{
								'zh-CN': '示例',
								'en': 'Examples',
								'zh-TW': '示例',
							},
						},
						{
							label: '快速开始',
							slug: 'guides/start',
							translations:{
								'zh-CN': '快速开始',
								'en': 'Quick Start',
								'zh-TW': '快速開始',
							},
						},
					],
				},
				{
					label: 'Reference',
					translations: {
						'zh-CN': '参考',
						'en': 'Reference',
						'zh-TW': '參考',
					},
					items:[
						{
							label: 'Selector',
							slug: 'reference/selector',
							translations:{
								'zh-CN': 'CSS选择器',
								'en': 'CSS Selector',
								'zh-TW': 'CSS選擇器',
							},
						},
						{
							label: 'Template',
							slug: 'reference/template',
							translations:{
								'zh-CN': '模板',
								'en': 'Template',
								'zh-TW': '模板',
							},
						},
						{
							label: 'Code',
							slug: 'reference/code',
							translations:{
								'zh-CN': '编程',
								'en': 'Code',
								'zh-TW': '程式',
							},
						},
					]
				},
			],
		}),
	],
});
