<!-- @format -->

<script setup lang="ts">
	import type { IIndexInfo } from ".";
	import type { IUserInfo } from "@/common";
	import type { IMenuItem } from "@/views/menus";
	import { RouteLocationNormalizedGeneric, RouteRecordRaw } from "vue-router";

	import Store from "store";

	import { useRouter } from "vue-router";
	import { Menu, MenuType } from "@/views/menus";
	import { zhCn } from "element-plus/es/locale";
	import { error } from "@/common/utils/Interactive";
	import { adminRequest } from "@/common/utils/Network";
	import { onBeforeMount, provide, reactive, ref } from "vue";
	import { ElConfigProvider, vLoading, ElDialog } from "element-plus";
	import { IndexTemplateProps } from "./views/templates";

	const router = useRouter();
	const rawItems = new Array<IMenuItem>();
	const mainLoading = reactive({
		value: false,
		set tip(v: string) {
			const tipElement = document.querySelector(`#main-loading .el-loading-text`);
			if (tipElement) {
				tipElement.textContent = v;
			}
		},
	});
	const previewDialogProps = reactive({
		show: false,
		src: "",
	});

	const ComponentsMapping: Record<string, any> = {
		Common: () => import("@/views/templates/IndexTemplate.vue"),

		"roles/index": () => import("@/views/users/Index.vue"),
		"users/index": () => import("@/views/users/Index.vue"),
		"users/admin/deleted/index": () => import("@/views/users/Index.vue"),
		"databases/index": () => import("@/views/databases/Index.vue"),
		"menus/index": () => import("@/views/menus/Index.vue"),
		"permissions/index": () => import("@/views/permissions/Index.vue"),

	};

	const userInfo = ref<IUserInfo>();

	provide("rawItems", rawItems);
	provide("userInfo", userInfo);
	provide("mainLoading", mainLoading);
	provide("previewDialogProps", previewDialogProps);

	onBeforeMount(() => {
		(window as any).router = router;

		router.beforeEach(navigate);
	});

	const navigate: Parameters<typeof router.beforeEach>[0] = async function (to, _from, next) {
		// 跳过不需要登陆验证的路由
		if (["retrieve"].includes(to.name as string)) {
			next();
			return;
		}

		// 未登录情况
		const cookieStore = Store.namespace("cookie");
		if (!cookieStore.get("value")) {
			const option = to.name != "login" ? { name: "login" } : undefined;
			next(option!);
			return;
		}

		// 已登陆情况，切换页面
		if (userInfo.value) {
			next();
			return;
		}

		// 已登陆情况，关闭网页后再次打开或刷新网页
		const result = await adminRequest({
			method: "GET",
			url: "/index",
			extraOptions: {
				loading: mainLoading,
				alwaysShowFeedbackMsg: false,
			},
		});

		if (!result.success) {
			error("alert", { content: result.msg ?? "菜单获取失败!" });
			return true;
		}

		await handleIndexData(result.data);
		next({ path: to.path, query: to.query });
		return true;
	};

	async function handleIndexData(data: IIndexInfo) {
		userInfo.value = data.userMsg;

		const blob = new Blob([data.fieldsConfig], { type: "application/javascript" });
		const url = URL.createObjectURL(blob);

		const promise = new Promise((resolve) => {
			const script = document.createElement("script");
			script.type = "module";
			script.src = url;
			document.body.append(script);
			resolve(undefined);
		});

		await promise;

		URL.revokeObjectURL(url);

		rawItems.reset(data.menus);
		rawItems.forEach((item) => {
			if (!item.url || item.url == "#" || item.type == MenuType.Menu || Menu.isExternalLink(item as any)) {
				return;
			}
			let viewName: string;
			let route = {} as RouteRecordRaw;

			route.name = `r${item.id}`;
			if (item.url[0] == "/") {
				route.path = item.url.substring("/".length);
				let idx = route.path.indexOf("?");
				if (idx != -1) {
					route.path = route.path.substring(0, idx);
				}
			} else {
				route.path = item.url;
			}

			if (route.path.endsWith("/")) {
				route.path = route.path + "index";
				item.url += "index";
			}

			if (item.type == MenuType.Item && !item.children) {
				viewName = `r${item.id}`;
			} else if (item.type != MenuType.Page) {
				return;
			} else {
				viewName = `r${item.pid}`;
			}

			route.props = {};
			route.components = {};
			if (ComponentsMapping[route.path] !== undefined) {
				route.components[viewName] = ComponentsMapping[route.path];
			} else {
				route.components[viewName] = ComponentsMapping["Common"];
			}
			route.props[viewName] = (to: RouteLocationNormalizedGeneric) => {
				const componentProps: IndexTemplateProps = {
					url: to.path,
					head: item.name,
					query: to.query as any,
				};

				return componentProps;
			};
			router.addRoute("admin", route);
		});
	}
</script>

<template>
	<ElConfigProvider :locale="zhCn">
		<div
			id="main-loading"
			element-loading-text="处理中..."
			v-loading.fullscreen.lock="mainLoading.value"
		>
			<RouterView />
		</div>
		<ElDialog
			align-center
			title="预览"
			class="image-preview"
			v-model="previewDialogProps.show"
		>
			<img :src="previewDialogProps.src" />
		</ElDialog>
	</ElConfigProvider>
</template>

<style scoped lang="css">
	div#main-loading {
		height: 100%;
		width: 100%;
	}

	.image-preview img {
		width: 100%;
		object-fit: contain;
	}
</style>
