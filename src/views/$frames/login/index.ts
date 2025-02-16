/** @format */

import { KasConfig } from "@/configs";
import { Constants } from "@/common/utils/Constants";
import type { Fields, IField } from "@/views/$frames/templates";

export const loginFields: Fields = {
	account: {
		display_name: "ID",
		field_name: "account",
		editable: true,
		config: {
			index: 1,
			layoutSpan: 24,
			type: "text",
			rule: [
				{ required: true, message: "请输入账户!", trigger: "blur" },
				{
					validator(rule, value: string, callback, source, options) {
						const idMatch = KasConfig.idRegex.test(value); // 用户id登录
						const uidMatch = KasConfig.uidRegex.test(value); // 用户名登录
						const emailMatch = Constants.emailRegex.test(value); // 邮箱登录
						const phoneMatch = Constants.phoneRegex.test(value); // 手机号登录

						if (uidMatch || emailMatch || phoneMatch || idMatch) {
							callback();
							return;
						}

						if (value.match(/^\d*$/)) {
							if (value.length === 11) {
								callback("请输入正确的手机号!");
							} else {
								callback("请输入正确的账号!");
							}
						} else if (value.includes("@")) {
							callback("请输入正确的邮箱!");
						} else {
							callback("请输入正确用户名!");
						}
					},
					trigger: "blur",
				},
			],
			bindProps: {
				placeholder: "账号/用户名/手机号/邮箱",
			},
			itemBindProps: {
				label: "",
				labelWidth: "0",
			},
		},
	},
	pwd: {
		display_name: "密码",
		field_name: "pwd",
		editable: true,
		config: {
			index: 2,
			layoutSpan: 24,
			type: "text",
			rule: [{ required: true, message: "请输入密码!", trigger: "blur" }],
			bindProps: {
				type: "password",
				showPassword: true,
			},
			itemBindProps: {
				label: "",
				labelWidth: "0",
			},
		},
	},
	remember: {
		display_name: "记住密码",
		field_name: "remember",
		editable: true,
		config: {
			index: 3,
			layoutSpan: 24,
			type: "checkbox",
			itemBindProps: {
				label: "",
				labelWidth: "0",
			},
		},
	},
} as Record<string, Partial<IField>> as any;
