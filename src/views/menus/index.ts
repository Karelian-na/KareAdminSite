/** @format */

import { Nullable } from "@/common/utils";
import { Constants } from "@/common/utils/Constants";

export type DetailMenuItem = Menu & IMenuItem;

interface StackItem {
	startIdx: number;
	items: IMenuItem[];
}

export interface IMenuItem {
	id: number;
	name: string;
	type: MenuType;
	icon: string;
	url: string;
	pid: number;
	level: number;
	parent: IMenuItem;
	children: IMenuItem[] | undefined;
}

export class Menu {
	id: number;
	name: string;
	type: MenuType;
	oper_type: number;
	icon: string;
	url: string;
	pid: number;
	status: boolean;
	descrip: string;

	level: number;
	parent: Nullable<Menu>;
	children: Nullable<Array<Menu>>;

	constructor() {
		this.id = 0;
		this.name = "";
		this.type = 1;
		this.icon = "";
		this.url = "";
		this.pid = 0;
		this.oper_type = 0;
		this.status = true;
		this.descrip = "";
		this.level = 0;
		this.parent = null;
		this.children = null;
	}

	public find(id: number): Nullable<Menu> {
		if (!this.children) {
			return null;
		}

		return Menu.find(id, this.children);
	}

	public delete(id: number): boolean {
		if (!this.children) {
			return false;
		}
		return Menu.delete(id, this.children);
	}

	public static find(id: number, children: Array<Menu>): Nullable<Menu> {
		if (!children || !children.length) {
			return null;
		}

		for (const child of children) {
			if (child.id === id) {
				return child;
			}

			if (!child.children) {
				continue;
			}

			const result = this.find(id, child.children);
			if (result) {
				return result;
			}
		}

		return null;
	}

	public static delete(id: number, children: Array<Menu>): boolean {
		if (!children || !children.length) {
			return false;
		}

		for (let idx = 0; idx < children.length; idx++) {
			if (children[idx].id == id) {
				children.remove(idx);
				return true;
			} else if (children[idx].children) {
				const deleted = this.delete(id, children[idx].children!);
				if (deleted) {
					return true;
				}
			}
		}

		return false;
	}

	public static flat(items: Array<Menu>): Array<Menu> {
		const arr = new Array<Menu>();
		for (let idx = 0; idx < items.length; idx++) {
			arr.push(items[idx]);
			if (items[idx].children == null) {
				continue;
			}

			const res = Menu.flat(items[idx].children!)!;
			arr.push(...res);
		}
		return arr;
	}

	public static isExternalLink(menu: Menu): boolean {
		return Boolean(menu.url && Constants.externalLinkRegex.test(menu.url));
	}
}

export const MenuTypeFields = ["", "menu", "item", "page", "oper"];
export const MenuTypeNames = ["", "菜单", "选项", "标签", "操作"];

export enum MenuType {
	Menu = 1,
	Item,
	Page,
	Oper,
}

export function handleMenus(items: IMenuItem[]): IMenuItem[] {
	const menus: IMenuItem[] = items.map((val) => val);
	// collect top level menus
	let result: IMenuItem[] = [];
	let parents: IMenuItem[] = [];
	while (menus.length && !menus[0].pid) {
		parents.push(menus.shift()! as unknown as IMenuItem);
	}
	result = parents.sort((left, right) => {
		if (left.type < right.type) {
			return -1;
		} else if (left.type > right.type) {
			return 1;
		}

		if (left.type === MenuType.Item) {
			return Constants.externalLinkRegex.test(left.url) ? 1 : -1;
		}

		return 0;
	});

	// transform linear to tree
	let count = 0;
	let level = 1;
	let startIdx = 0;
	let stack: StackItem[] = [];
	while (true) {
		while (startIdx < parents.length) {
			const current = parents[startIdx];
			const sons: IMenuItem[] = [];

			current.level = level;
			if (current.type != MenuType.Oper && menus[0]) {
				if (menus[0].pid == current.id) {
					while (menus[0]?.pid == current.id) {
						const son = menus.shift()!;
						son.parent = current;
						sons.push(son);
					}
				} else {
					let left = 0;
					let right = menus.length - 1;
					let mid = Math.floor((left + right) / 2);
					while (left <= right) {
						if (menus[mid].pid > current.id) {
							right = mid - 1;
						} else if (menus[mid].pid < current.id) {
							left = mid + 1;
						} else {
							let idx = left;
							while (idx <= right) {
								if (menus[idx].pid == current.id) {
									const son = menus.remove(idx);
									son.parent = current;
									sons.push(son);
									--right;
								} else {
									++idx;
								}
							}
							break;
						}
						mid = Math.floor((left + right) / 2);
						++count;
						if (count > 1000) {
							break;
						}
					}
				}
			}
			if (sons.length > 0) {
				current.children = sons;
				++startIdx;
				stack.push({
					startIdx: startIdx,
					items: parents,
				});
				startIdx = 0;
				++level;
				parents = sons;
			} else {
				++startIdx;
			}
		}
		if (stack.length > 0) {
			const stackItem = stack.pop() as unknown as StackItem;
			startIdx = stackItem.startIdx;
			parents = stackItem.items;
			--level;
		} else {
			break;
		}
		++count;
		if (count > 1000) {
			break;
		}
	}
	return result;
}

export function toLinearArray(result: IMenuItem[]) {
	let arr: IMenuItem[] = [];
	const func = function (items: IMenuItem[]) {
		for (let idx = 0; idx < items.length; idx++) {
			arr.push(items[idx]);
			if (items[idx].children != null) {
				func(items[idx].children!);
			}
		}
	};
	func(result);
	return arr;
}
