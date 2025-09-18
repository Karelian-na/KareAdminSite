/** @format */
import type { IField } from "../templates";

import Store from "store";

import { requiredRule } from "@/common/utils";

export namespace Databases {
	export interface DbCheckInfo {
		initialized: boolean;
	}

	export const initUrl = "/admin/databases/init";
	export const initFields = {
		host: {
			config: {
				index: 0,
				layoutSpan: 24,
				type: "text",
				bindProps: { disabled: true },
			},
			field_name: "host",
			display_name: "数据库地址",
			editable: true,
		},
		database: {
			config: {
				index: 1,
				layoutSpan: 24,
				type: "text",
				bindProps: { disabled: true },
			},
			field_name: "database",
			display_name: "数据库名称",
			editable: true,
		},
		db_user: {
			config: {
				index: 1,
				layoutSpan: 24,
				type: "text",
				rule: [requiredRule, { min: 2, max: 64 }],
			},
			field_name: "db_user",
			display_name: "数据库初始化用户",
			editable: true,
		},
		db_pwd: {
			config: {
				index: 2,
				layoutSpan: 24,
				type: "text",
				rule: [requiredRule, { min: 2, max: 64 }],
				bindProps: {
					type: "password",
				},
			},
			field_name: "db_pwd",
			display_name: "数据库初始化用户密码",
			editable: true,
		},
	} as Record<string, Partial<IField>> as any;

	export function isInitialized(): boolean {
		const cookieStore = Store.namespace("cookie");
		const checkRes = cookieStore.get("check");
		return checkRes?.initialized === true;
	}

	export function setInitFlag(init: boolean) {
		const cookieStore = Store.namespace("cookie");
		let checkRes = cookieStore.get("check");
		if (!checkRes) {
			checkRes = {} as DbCheckInfo;
		}
		checkRes.initialized = init;
		cookieStore.set("check", checkRes);
	}
}
