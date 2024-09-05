/** @format */

import type { Nullable } from ".";
import type { ElMessageBoxOptions, LoadingOptionsResolved, MessageOptions } from "element-plus";

import { ElLoading, ElMessage, ElMessageBox } from "element-plus";

export type LoadingInstance = ReturnType<typeof ElLoading.service>;
export type AlertOptions = ElMessageBoxOptions & { content?: string };
export type CustomMessageOptions = MessageOptions | AlertOptions;

type LoadingOption = Partial<
	Omit<LoadingOptionsResolved, "target" | "parent"> & {
		target: string | HTMLElement;
		body: boolean;
	}
>;

export interface ILoading {
	tip?: string;
	value: boolean;
}

export function confirm(content: string, options?: AlertOptions) {
	return ElMessageBox.alert(
		content,
		options?.content ?? "警告",
		Object.assign({}, options, {
			type: "warning",
			draggable: true,
			showCancelButton: true,
		})
	);
}

export function success(type: "alert" | "msg", options?: CustomMessageOptions) {
	if (type == "alert") {
		const opt = options as AlertOptions | undefined;
		ElMessageBox.alert(
			opt?.content ?? "操作成功!",
			opt?.title ?? "信息",
			Object.assign(opt ?? {}, {
				type: "success",
				draggable: true,
				showCancelButton: false,
			} as ElMessageBoxOptions)
		);
	} else {
		const opt = options as MessageOptions | undefined;
		ElMessage.success(
			Object.assign(opt ?? {}, {
				message: opt?.message ?? "操作成功!",
				showClose: true,
				grouping: true,
			} as MessageOptions)
		);
	}
}

export function error(type: "alert" | "msg", options?: CustomMessageOptions) {
	if (type == "alert") {
		const opt = options as AlertOptions | undefined;
		ElMessageBox.alert(
			opt?.content ?? "操作失败!",
			opt?.title ?? "错误",
			Object.assign(opt ?? {}, {
				type: "error",
				draggable: true,
				showCancelButton: false,
			} as ElMessageBoxOptions)
		);
	} else {
		const opt = options as MessageOptions | undefined;
		ElMessage.error(
			Object.assign(opt ?? {}, {
				message: opt?.message ?? "操作失败!",
				showClose: true,
				grouping: true,
			} as MessageOptions)
		);
	}
}

export function info(type: "alert" | "msg", options: MessageOptions | (AlertOptions & { content: string })) {
	if (type == "alert") {
		const opt = options as AlertOptions & { content: string };
		ElMessageBox.alert(
			opt.content,
			opt?.title ?? "信息",
			Object.assign(
				{
					type: "info",
					draggable: true,
					showCancelButton: false,
					callback: (action, _) => {},
				} as ElMessageBoxOptions,
				opt
			)
		);
	} else {
		const opt = options as MessageOptions;
		ElMessage.info(
			Object.assign(opt, {
				message: opt.message,
				showClose: true,
				grouping: true,
			} as MessageOptions)
		);
	}
}

var count = 0;
var feedbacks: CallableFunction[] = [];
var loading: Nullable<LoadingInstance>;

export function showLoading(tip?: string, options?: LoadingOption) {
	if (!loading) {
		loading = ElLoading.service(
			Object.assign(
				{
					text: tip ?? "加载中...",
					background: "#ffffffcc",
				} as LoadingOption,
				options
			)
		);
		const fn = loading.close;

		loading.close = () => {
			--count;
			if (count == 0) {
				fn();
				if (feedbacks) {
					setTimeout(() => {
						feedbacks.forEach((fn) => fn());
						feedbacks = [];
					}, 100);
				}
				loading = null;
			}
		};
	}
	++count;
	return loading;
}

