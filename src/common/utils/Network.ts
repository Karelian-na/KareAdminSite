/** @format */

import type { Arrayable } from ".";
import type { Router } from "vue-router";
import type { AxiosRequestConfig } from "axios";
import type { ILoading } from "@/common/utils/Interactive";

import { nextTick } from "vue";
import { topRoutes } from "@/router";
import { KasConfig } from "@/configs";
import { UploadUserFile } from "element-plus";
import { Result } from "@/common/utils/Result";
import { Databases } from "@/views/$frames/databases";
import { error, success } from "@/common/utils/Interactive";

import Store from "store";
import Axios from "axios";

// Axios请求相关
export type AxiosRequestCallback = (result: Result) => boolean | void | Promise<boolean> | Promise<void>;
export type AxiosRequestOption = AxiosRequestConfig & {
	extraOptions?: {
		loading?: ILoading;
		alwaysShowFeedbackMsg?: boolean;
	};
	callback?: AxiosRequestCallback;
};

export async function axiosRequest(config: AxiosRequestOption) {
	config.withCredentials = true;
	if (!config.baseURL) {
		config.baseURL = KasConfig.axios.serverHost;
	}

	const oldCallback = config.callback;
	config.callback = (result) => {
		if (result.isInitializationError()) {
			Databases.setInitFlag(false);
			const router = (window as any).router as Router;
			router.replace(topRoutes.init);
			return true;
		}

		// 登录状态失效或未登录，跳转到登录页面
		if (result.code == Result.ERROR_UN_LOGIN) {
			// const handled = await callback?.(result);
			Store.namespace("cookie").each((val, key) => {
				Store.namespace("cookie").remove(key);
			});
			const router = (window as any).router as Router;
			router.replace(topRoutes.login);
			return true;
		}

		if (oldCallback) {
			return oldCallback?.(result);
		}
		return false;
	};

	// 保存额外选项
	const extraOptions = config.extraOptions;
	if (extraOptions) {
		delete config.extraOptions;
	}

	let result: Result;

	extraOptions?.loading && (extraOptions.loading.value = true);
	await nextTick();
	try {
		const response = await Axios<Result>(config);
		result = response.data;
		Object.setPrototypeOf(result, Result.prototype);
		result.response = response;
	} catch (ex: any) {
		result = new Result(ex.message);
	}

	// 未联网，或无法连接服务器
	if (result.isNetworkError()) {
		extraOptions?.loading && (extraOptions.loading.value = false);
		error("alert", { message: "网络错误，无法连接至服务器！" });
		return result;
	}

	// 如果未指定请求反馈或指定请求反馈后调用方不处理反馈，则使用缺省反馈消息
	if ((!config.callback || !(await config.callback(result))) && extraOptions?.alwaysShowFeedbackMsg !== false) {
		if (result.success) {
			success("msg", { message: "操作成功!" });
		} else {
			error("msg", { message: `操作失败! ${result.msg ?? ""}` });
		}
	}
	extraOptions?.loading && (extraOptions.loading.value = false);
	return result;
}

let uploadedFilePaths = {} as Record<number, string>;
export async function uploadFile(files: Arrayable<UploadUserFile>, extraOptions?: AxiosRequestOption["extraOptions"]): Promise<Result<Array<string>>> {
	const urls = [] as Array<string>;
	const formData = new FormData();
	const unUploadFiles = [] as UploadUserFile[];

	const targets = Array.isArray(files) ? files : [files];
	for (const file of targets) {
		if (!uploadedFilePaths[file.uid!]) {
			if (!file.raw || !(file.raw instanceof File)) {
				return new Result("文件上传失败：文件数据异常！");
			}

			formData.append("files", new Blob([file.raw as File]), file.name);
			unUploadFiles.push(file);
		} else {
			urls.push(uploadedFilePaths[file.uid!]);
		}
	}

	const loading = extraOptions?.loading;
	if (unUploadFiles.length) {
		const options: AxiosRequestOption = {
			url: "/upload",
			method: "POST",
			data: formData,
		};

		if (loading) {
			delete extraOptions.loading;
			loading.value = true;
			options.onUploadProgress = (e) => {
				const percentage = (e.progress! * 100).toPrecision(3);
				loading.tip = "上传中... " + percentage + "%";
			};
		}

		options.extraOptions = extraOptions;
		const result = await axiosRequest(options);

		if (loading) {
			loading.value = false;
		}

		if (result.success) {
			const paths = (result.data as string).split(";");
			unUploadFiles.forEach((file, idx) => {
				uploadedFilePaths[file.uid!] = paths[idx];
				urls.push(paths[idx]);
			});
		} else if (options?.extraOptions?.alwaysShowFeedbackMsg) {
			error("msg", { message: `文件上传失败：${result.msg}！` });
			return result;
		} else {
			return result;
		}
	}

	return new Result(true, urls);
}
