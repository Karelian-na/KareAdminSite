/** @format */

import { KeyStringObject } from ".";

/** @format */
export {};

declare global {
	interface Array<T> {
		clear(): void;
		remove(idx: number): T;
		reset(other: Array<T>): void;
		insert(idx: number, ...vals: Array<T>): void;
	}

	interface Map<K, V> {
		getByValue(searchValue: V, predict?: (fst: V, sec: V) => boolean): K;
	}
}

Array.prototype.clear = function () {
	this.splice(0, this.length);
};
Array.prototype.remove = function (idx) {
	if (idx < 0 || idx >= this.length) {
		return undefined;
	}

	return this.splice(idx, 1)[0];
};
Array.prototype.reset = function (other) {
	this.splice(0, this.length, ...other);
};
Array.prototype.insert = function (idx, ...vals) {
	if (idx <= 0) {
		this.splice(0, 0, ...vals);
	} else if (idx >= this.length - 1) {
		this.splice(this.length - 1, 0, ...vals);
	} else {
		this.splice(idx, 0, ...vals);
	}
};

Map.prototype.getByValue = function (searchValue, predict) {
	if (predict) {
		for (let [key, value] of this.entries()) {
			if (predict(value, searchValue)) return key;
		}
	} else {
		for (let [key, value] of this.entries()) {
			if (value === searchValue) return key;
		}
	}
	return null;
};

export namespace ObjectUtils {
	export function getChangedAttributes(origin: KeyStringObject, changed: KeyStringObject) {
		const keys = Object.keys(changed);
		if (keys.length !== 0) {
			if (Array.isArray(changed)) {
				const temp = JSON.stringify(changed);
				return JSON.stringify(origin) === temp ? undefined : JSON.parse(temp);
			} else {
				const res: KeyStringObject = {};
				keys.forEach((key) => {
					if (origin[key] && typeof changed[key] === "object") {
						const value = getChangedAttributes(origin[key], changed[key]);
						if (value) {
							res[key] = value;
						}
						return;
					}

					if (origin[key] != changed[key]) {
						res[key] = changed[key];
					}
				});
				return Object.keys(res).length ? res : undefined;
			}
		} else if (Object.keys(origin).length !== 0) {
			return ObjectUtils.clone(changed);
		} else {
			return undefined;
		}
	}

	export function mergeAttributes<T extends Object>(obj: T, key: keyof T, val: Object) {
		if (typeof obj !== "object") {
			return;
		}

		if (!obj.hasOwnProperty(key)) {
			Object.defineProperty(obj, key, { value: {}, writable: true, enumerable: true });
		}

		Object.assign((obj as any)[key], val);
	}

	export function clone<T>(obj: T, specifyflag?: boolean | keyof T, ...specifyFields: Array<keyof T>) {
		if (!obj) {
			return obj;
		}

		if (!(obj instanceof Object)) {
			const res = obj;
			return res;
		}

		if (Array.isArray(obj)) {
			return JSON.parse(JSON.stringify(obj));
		}

		// true 为忽略方式， false 为指定方式
		const filterType = typeof specifyflag === "boolean" ? specifyflag : true;

		if (typeof specifyflag !== "boolean" && specifyflag) {
			specifyFields.push(specifyflag);
		}
		const copyFields = filterType ? (Object.keys(obj) as Array<keyof T>).filter((item) => !specifyFields.includes(item)) : specifyFields;

		const record = copyFields.reduce((prev, field) => {
			prev[field] = obj[field];
			return prev;
		}, {} as T);

		return JSON.parse(JSON.stringify(record));
	}

	export function reset<T>(obj: T, value: T, clone?: boolean) {
		if (!obj || typeof obj !== "object") {
			return obj;
		}

		for (const key in obj) {
			delete obj[key];
		}

		Object.assign(obj, clone ? ObjectUtils.clone(value) : value);
		return obj;
	}
}
