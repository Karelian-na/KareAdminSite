/**
 * @format
 * @Author: Karelian_na
 */

import type { AxiosResponse } from "axios";

export class Result<T = any> extends Object {
	public static readonly ERROR_UN_LOGIN = 0x5000005;
	public static readonly FIELD_VALIDATION_ERROR = 0x6000000;
	public static readonly SYSTEM_NOT_INITIALIZED = 0x500000c;

	public code: number = -1;
	public success: boolean = false;
	public msg?: string;
	public data?: T;
	public response?: AxiosResponse<Result<T>, any>;

	constructor(success: boolean, data?: T);
	constructor(msg: string);

	constructor(successOrMsg: boolean | string, data?: T) {
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

	public isFieldValidationError() {
		return !this.success && this.code & Result.FIELD_VALIDATION_ERROR;
	}

	public getErrorField() {
		if (this.isFieldValidationError()) {
			const commaIdx = this.msg?.indexOf(":");
			if (commaIdx && commaIdx !== -1) {
				return this.msg!.substring(commaIdx + 1).trim();
			}
		}
		return undefined;
	}

	public isInitializationError() {
		return !this.success && this.code === Result.SYSTEM_NOT_INITIALIZED;
	}
}
