/** @format */

import type { Ref } from "vue";
import type { Router } from "vue-router";

declare global {
	interface Window {
		router: Router;
		templateFormData: Ref<KeyStringObject>;
	}

	const useFormData: () => Ref<KeyStringObject>;
}

// 通用类型
export type Optional<T> = T | undefined;
export type Nullable<T extends {}> = T | null;
export type Emptyable<T extends {}> = Optional<Nullable<T>>;

export type Arrayable<T> = T | Array<T>;
export type Promisable<T> = T | Promise<T>;
export type KeyStringObject = Record<string, any>;

export type SecurityOption = {
	name: string;
	icon: string;
	title: string;
	type?: number;
};

// 验证相关
export type VerifyCodeSendingHandler = () => void;
export type VerifyCodeSentCallback = (pageTraceId: string) => void;

export const EmptyObject = {} as any;
export const requiredRule = { required: true, message: "必填项不能为空!", trigger: "blur" };

(globalThis as any).useFormData = function () {
	return window.templateFormData.value;
};
