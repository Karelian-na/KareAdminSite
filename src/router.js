/** @format */

import { createWebHistory, createRouter } from "vue-router";

/**
 * @type {() => import("vue-router").RouterOptions}
 */
export const router = createRouter({
	routes: [
		{
			path: "/login",
			name: "login",
			component: () => import("@/views/login/Login.vue"),
		},
		{
			path: "/index",
			name: "index",
			redirect: "/",
		},
		{
			path: "/retrieve",
			name: "retrieve",
			component: () => import("@/views/home/Revisepwd.vue"),
			props: (route) => ({
				mode: "retrieve",
				account: route.query.account,
			}),
		},
		{
			path: "/",
			name: "admin",
			component: () => import("@/views/index/Index.vue"),
			redirect: "/home",
			children: [
				{
					path: "/home",
					name: "home",
					components: {
						home: () => import("@/views/home/Home.vue"),
					},
				},
				{
					path: "/personal",
					name: "personal",
					components: {
						personal: () => import("@/views/home/Personal.vue"),
					},
				},
			],
		},
		{
			path: "/:path(.*)",
			name: "404",
			component: () => import("@/views/error/404.vue"),
		},
	],
	history: createWebHistory(),
});
