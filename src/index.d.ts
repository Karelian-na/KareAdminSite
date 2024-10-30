/** @format */

import type { Menu } from "./menus";
import type { IUserInfo } from "./common";

export interface IIndexInfo {
	fieldsConfig: string;
	menus: Array<Menu>;
	userMsg: IUserInfo;
}
