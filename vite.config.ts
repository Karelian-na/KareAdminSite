/** @format */

import { UserConfig } from "vite";

import Path from "path";
import Vue from "@vitejs/plugin-vue";

const config: UserConfig = {
	root: "./src",
	base: "/",
	plugins: [Vue()],
	server: {
		host: "0.0.0.0",
		port: 800,
		proxy: {
			"/api": {
				target: "http://kas.karelian.cn:8000",
				rewrite: (path) => path.replace(/^\/api/, ""),
			},
			"/resources": {
				target: "http://kas.karelian.cn:8000",
				rewrite: (path) => path.replace(/^\/resources/, ""),
			},
		},
	},
	build: {
		emptyOutDir: true,
		sourcemap: process.env["mode"] === "development",
		outDir: Path.resolve(__dirname, "out/"),
	},
	resolve: {
		alias: [
			{
				find: "element-plus",
				replacement: Path.resolve(__dirname, "node_modules/element-plus"),
			},
			{
				find: "@",
				replacement: Path.resolve(__dirname, "src"),
			},
		],
	},
};

export default config;
