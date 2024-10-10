/** @format */

import type { Fields, IField } from "@/views/templates";

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
						const idMatch = /^[1-9]\d{7}$/.test(value); // 用户id登录
						const uidMatch = /^[a-zA-Z]\w{5,20}$/.test(value); // 用户名登录
						const emailMatch = /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/.test(value); // 邮箱登录
						const phoneMatch = /^(13[0-9]|14[5|7]|15[0|1|2|3|5|6|7|8|9]|18[0|1|2|3|5|6|7|8|9])\d{8}$/.test(value); // 手机号登录

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
