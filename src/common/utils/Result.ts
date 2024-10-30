/**
 * @format
 * @Author: Karelian_na
 */

import type { AxiosResponse } from "axios";

export class Result extends Object {
	public static readonly ERROR_UN_LOGIN = 0x5000005;

	public code: number = -1;
	public success: boolean = false;
	public msg?: string;
	public data?: any;
	public response?: AxiosResponse<Result, any>;

	constructor(success: boolean, data?: any);
	constructor(msg: string);

	constructor(successOrMsg: boolean | string, data?: any) {
		super();
		if (typeof successOrMsg === "boolean") {
			this.success = successOrMsg;
			this.data = data;
		} else {
			this.msg = successOrMsg;
		}
	}

	public isNetworkError() {
		return this.msg === "Network Error";
	}
}
