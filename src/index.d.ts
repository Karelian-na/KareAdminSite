/** @format */

import { IUserInfo } from "./common";
import { IMenuItem } from "./menus";

export interface IIndexInfo {
	fieldsConfig: string;
	menus: Array<IMenuItem>;
	userMsg: IUserInfo;
}
