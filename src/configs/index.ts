/** @format */

export namespace KasConfig {
	export const idRegex = /^[1-9]\d{7}$/;
	export const uidRegex = /^[a-zA-Z]\w{5,20}$/;

	export const sysTitle = "Kas 后台管理系统";
	export const sysIcon = "/admin/assets/imgs/favicon.png";

	export const axios = {
		serverHost: "//kas.karelian.cn:800/api",
	};

	export const iconfont = {
		prefix: "icon-",
		valueRegex: /^[\w-]+$/,
		libUrl: "//at.alicdn.com/t/c/font_4677547_4a667hs1wgs.json",
	};
}
