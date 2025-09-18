/** @format */

import { Databases } from "./views/$frames/databases";
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

/** @type {Record<"login" | "retrieve" | "init" | "index", import("vue-router").RouteRecordRaw>} */
export const topRoutes = {
	login: {
		path: "/admin/login",
		name: "login",
		component: () => import("@/views/$frames/login/Login.vue"),
	},
	retrieve: {
		path: "/admin/retrieve",
		name: "retrieve",
		component: () => import("@/views/$frames/home/Revisepwd.vue"),
		props: (route) => ({
			mode: "retrieve",
			account: route.query.account,
		}),
	},
	init: {
		path: Databases.initUrl,
		name: "init",
		component: () => import("@/views/$frames/databases/Init.vue"),
	},
	index: {
		path: "/admin/index",
		name: "index",
		redirect: "/admin",
	},
};

export const router = createRouter({
	routes: [
		...Object.values(topRoutes),
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
