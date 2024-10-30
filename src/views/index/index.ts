/** @format */

import type { Menu } from "../menus";

/**
 * @description 主页的标签属性
 * @author Karelian_na
 * @date 2023/09/14 09:58:33
 * @export
 * @interface ITab
 */
export interface ITab {
	/**
	 * @description 标签名
	 * @author Karelian_na
	 * @date 2023/09/14 10:01:51
	 * @type {string}
	 * @memberof ITab
	 */
	name: string;

	/**
	 * @description 标签点击时请求页面的地址，用于匹配查找标签，当对应的菜单项包含页面菜单时，该值等于其所有子页面菜单中第一个页面的请求地址
	 * @author Karelian_na
	 * @date 2023/09/14 10:02:01
	 * @type {string}
	 * @memberof ITab
	 */
	url: string;

	/**
	 * 上传切换标签时，此时标签的完整请求地址，包括 query
	 *
	 * @author Karelian_na
	 * @date 2024/09/13 08:55:32
	 */
	lastRecordUrl?: string;

	/**
	 * @description 标签展示文本
	 * @author Karelian_na
	 * @date 2023/09/14 10:02:19
	 * @type {string}
	 * @memberof ITab
	 */
	title: string;

	/**
	 * @description 标签关联的Html元素
	 * @author Karelian_na
	 * @date 2023/09/14 10:02:31
	 * @type {HTMLLIElement}
	 * @memberof ITab
	 */
	element?: HTMLLIElement;

	/**
	 * @description 页内当前标签的键，当刷新页面时，改变该值，使组件强制更新
	 * @author Karelian_na
	 * @date 2023/09/14 10:09:32
	 * @type {number}
	 * @memberof IInPageProps
	 */
	key?: Date;
}

/**
 * @description 主页下页面内的各标签页的属性
 *
 * 该标签展示在 {@link ITab} 对应的页面下
 * @author Karelian_na
 * @date 2023/09/14 09:31:19
 * @export
 * @interface IInPageTab
 */
export interface IInPageTab {
	/**
	 * @description 标签ID
	 * @author Karelian_na
	 * @date 2023/09/14 09:59:39
	 * @type {number}
	 * @memberof IInPageTab
	 */
	id: number;

	/**
	 * @description 标签展示名
	 * @author Karelian_na
	 * @date 2023/09/14 09:59:48
	 * @type {string}
	 * @memberof IInPageTab
	 */
	name: string;

	/**
	 * @description 标签点击时，请求的页面的地址
	 * @author Karelian_na
	 * @date 2023/09/14 10:00:02
	 * @type {string}
	 * @memberof IInPageTab
	 */
	url: string;

	/**
	 * @description 标签的图标
	 * @author Karelian_na
	 * @date 2023/09/14 10:00:17
	 * @type {string}
	 * @memberof IInPageTab
	 */
	icon?: string;

	/**
	 * @description 上次离开时的请求地址
	 * @author Karelian_na
	 * @date 2024/10/24 00:03:57
	 * @type {string}
	 * @memberof IInPageTab
	 */
	lastQuery?: string;
}

/**
 * @description 页内相关属性
 * @author Karelian_na
 * @date 2023/09/14 10:08:46
 * @export
 * @interface IInPageProps
 */
export interface IInPageProps {
	/**
	 * @description 业内当前标签，取自于 {@link IInPageTab.id}
	 * @author Karelian_na
	 * @date 2023/09/14 10:09:01
	 * @type {number}
	 * @memberof IInPageProps
	 */
	curTab: number;

	/**
	 * @description 该页所有的标签集合
	 * @author Karelian_na
	 * @date 2023/09/14 10:09:16
	 * @type {Array<IInPageTab>}
	 * @memberof IInPageProps
	 */
	tabs: Array<IInPageTab>;
}

export type IPageProps = string;

/**
 * 主页下标签与页面的映射
 */
export type TabPageMapType = Map<ITab, IPageProps>;

/**
 * 主页下菜单项与标签的映射
 */
export type ItemTabMapType = Map<number, ITab>;

/**
 * 主页下页面与对应页内标签的映射
 */
export type PageInPageTabMapType = Map<IPageProps, IInPageProps>;

/**
 * 创建标签的函数原型
 */
export type CreateTabFunction = (navItem: Menu) => ITab;

/**
 * 交换页面的函数原型
 */
export type CloseTabFunction = (tabProps: ITab) => void;

/**
 * 交换页面的函数原型
 */
export type SwitchPageFunction = (tabProps: ITab, itemClick: boolean, replaceRoute?: boolean) => void;

/**
 * 主页下特殊的标签名
 */
export type SpecialTabName = "home" | "personal";

/**
 * 主页下特殊标签属性
 */
export const specialTabs: Record<SpecialTabName, ITab> = {
	home: {
		name: "home",
		url: "/home",
		title: "主页",
	},
	personal: {
		name: "personal",
		url: "/personal",
		title: "个人中心",
	},
};

/**
 * 主页下特殊标签对应的业内属性
 */
export const specialInPageProps: Record<SpecialTabName, IInPageProps> = {
	home: {
		tabs: [
			{
				id: 0,
				name: specialTabs.home.name,
				url: specialTabs.home.url,
			},
		],
		curTab: 0,
	},
	personal: {
		tabs: [
			{
				id: 0,
				name: specialTabs.personal.name,
				url: specialTabs.personal.url,
			},
		],
		curTab: 0,
	},
};
