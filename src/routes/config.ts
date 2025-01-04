import type { RouteRecordRaw } from 'vue-router'
import Home from '../pages/Home.vue'
export const routes:RouteRecordRaw[] = [
    {
        path: '/',
        name: 'home',
        component: Home
    },
    {
        path: '/backup-auth',
        name: 'Backup Auth',
        component: () => import('../pages/BackupAuth.vue')
    }
]