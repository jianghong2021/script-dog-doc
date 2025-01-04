import {createRouter, createWebHistory} from 'vue-router'
import { routes } from './config'
export const router = createRouter({
    routes,
    history: createWebHistory('/script-dog-doc/')
})