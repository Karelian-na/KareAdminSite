/** @format */

import { createWebHistory, createRouter } from "vue-router";

export const router = createRouter({
	routes: [
		{
			path: "/login",
			name: "login",
			component: () => import("@/views/$frames/login/Login.vue"),
		},
		{
			path: "/index",
			name: "index",
			redirect: "/",
		},
		{
			path: "/retrieve",
			name: "retrieve",
			component: () => import("@/views/$frames/home/Revisepwd.vue"),
			props: (route) => ({
				mode: "retrieve",
				account: route.query.account,
			}),
		},
		{
			path: "/",
			name: "admin",
			component: () => import("@/views/$frames/index/Index.vue"),
			redirect: "/home",
			children: [
				{
					path: "/home",
					name: "home",
					components: {
						home: () => import("@/views/$frames/home/Home.vue"),
					},
				},
				{
					path: "/personal",
					name: "personal",
					components: {
						personal: () => import("@/views/$frames/home/Personal.vue"),
					},
				},
			],
		},
		{
			path: "/:path(.*)",
			name: "404",
			component: () => import("@/views/$frames/error/404.vue"),
		},
	],
	history: createWebHistory(),
});
