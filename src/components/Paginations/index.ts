/** @format */

import type { IPageData } from "@/views/$frames/templates";

export interface ICommonPaginationModelValue extends Record<string, any>, Object {
	pageSize: number;
	ts?: number;
}

export type PaginationChangeCallback<T extends ICommonPaginationModelValue = ICommonPaginationModelValue> = (param: T, data?: IPageData) => void;

export type PaginationRefreshCallback = (data: IPageData) => void;

export interface IPaginationExposes {
	refresh: PaginationRefreshCallback;
}

/**
 * nomal pagination
 */
export interface IPaginationModeValue extends ICommonPaginationModelValue {
	pageIdx?: number;
}

/**
 * positioned pagination
 */
export enum PageDirection {
	PREV,
	NEXT,
}

export interface IPositionedPageModelValue extends ICommonPaginationModelValue {
	page_pos?: string;
	direction?: PageDirection;
}

export namespace Paginations {
	export const defaultPageSize = 20;
}
