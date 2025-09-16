/** @format */

import { createWebHistory, createRouter } from "vue-router";

export const specialRoute = {
	home: {
		name: "home",
		url: "/admin/home",
	},
	personal: {
		name: "personal",
		url: "/admin/personal",
	},
	error: {
		name: "error",
		url: "/admin/error",
	},
};

export const router = createRouter({
	routes: [
		{
			path: "/admin/login",
			name: "login",
			component: () => import("@/views/$frames/login/Login.vue"),
		},
		{
			path: "/admin/index",
			name: "index",
			redirect: "/admin",
		},
		{
			path: "/admin/retrieve",
			name: "retrieve",
			component: () => import("@/views/$frames/home/Revisepwd.vue"),
			props: (route) => ({
				mode: "retrieve",
				account: route.query.account,
			}),
		},
		{
			path: "/admin",
			name: "admin",
			component: () => import("@/views/$frames/index/Index.vue"),
			redirect: specialRoute.home.url,
			children: [
				{
					path: specialRoute.home.url,
					name: specialRoute.home.name,
					components: {
						home: () => import("@/views/$frames/home/Home.vue"),
					},
				},
				{
					path: specialRoute.personal.url,
					name: specialRoute.personal.name,
					components: {
						personal: () => import("@/views/$frames/home/Personal.vue"),
					},
				},
				{
					path: "/:path(.*)",
					name: specialRoute.error.name,
					components: {
						error: () => import("@/views/$frames/error.vue"),
					},
				},
			],
		},
	],
	history: createWebHistory(),
});
