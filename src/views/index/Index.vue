<!-- @format -->

<script setup lang="ts">
	import type { TabPaneName } from "element-plus";
	import type { ComponentInternalInstance } from "vue";
	import type { ITab, ItemTabMapType, TabPageMapType, PageInPageTabMapType, IInPageProps, SpecialTabName } from ".";

	import TabBar from "./TabBar.vue";
	import SideBar from "./SideBar.vue";
	import MenuBar from "./MenuBar.vue";
	import IconFont from "@/components/IconFont.vue";
	import { ElTabs, ElTabPane, vLoading } from "element-plus";

	import Store from "store";

	import { Menu } from "@/views/menus";
	import { error } from "@/common/utils/Interactive";
	import { RouterView, useRouter } from "vue-router";
	import { specialTabs, specialInPageProps } from ".";
	import { EmptyObject, Nullable, Optional } from "@/common/utils";
	import { onBeforeMount, provide, ref, nextTick, inject, shallowRef, reactive, watch, toRaw } from "vue";

	const rawItems = inject<Array<Menu>>("rawItems")!;

	const router = useRouter();
	const treeItems = Menu.treeable(rawItems);
	const cookieStore = Store.namespace("cookie");

	const tabMapPage = ref<TabPageMapType>(new Map());
	const itemMapTab = ref<ItemTabMapType>(new Map());
	const sidebar = ref<InstanceType<typeof SideBar>>(EmptyObject);
	const autoShrink = ref(cookieStore.get("autoShrink") ?? true);
	const pageMapInPageProps = shallowRef<PageInPageTabMapType>(new Map());
	const shrinked = ref(cookieStore.get("shrinked") ?? document.body.clientWidth <= 1000);
	const pageLoading = reactive({
		value: false,
		set tip(v: string) {
			const tipElement = document.querySelector(`#page-loading .el-loading-text`);
			if (tipElement) {
				tipElement.textContent = v;
			}
		},
	});

	const curNavItem = ref<number>(0);
	const curPage = ref<string>("home");
	const curTab = ref<ITab>(specialTabs.home);
	const curInPageProps = ref<IInPageProps>(specialInPageProps.home);

	provide("curTab", curTab);
	provide("shrinked", shrinked);
	provide("createTab", createTab);
	provide("closeTab", closeTab);
	provide("itemMapTab", itemMapTab);
	provide("tabMapPage", tabMapPage);
	provide("switchPage", switchPage);
	provide("curNavItem", curNavItem);
	provide("getNavItem", getNavItem);
	provide("autoShrink", autoShrink);
	provide("pageLoading", pageLoading);
	provide("curInPageProps", curInPageProps);

	onBeforeMount(() => {
		document.body.onresize = determinIfNeedShrinkWhenResize;
		window.onbeforeunload = recordTabsWhenUnload;

		tabMapPage.value.set(curTab.value, curTab.value.name);
		pageMapInPageProps.value.set(curTab.value.name, specialInPageProps.home);
		pageMapInPageProps.value.set(specialTabs.personal.name, specialInPageProps.personal);

		const tabProps = cookieStore.get("tabProps") as Optional<Array<ITab>>;
		if (!tabProps) {
			router.replace({ name: "home" });
			return;
		}

		// 还原上次离开时所有的标签页
		tabProps.shift();
		tabProps.forEach((tab) => {
			const matches = tab.name.match(/r(\d{1,})/);
			if (matches) {
				const navId = parseInt(matches[1]);
				const navItem = getNavItem(navId);
				if (navItem) {
					const newTab = createTab(navItem, tab.url);
					itemMapTab.value.set(navId, newTab);
				}
			} else {
				const newTab = specialTabs[tab.name as SpecialTabName];
				newTab.url = tab.url;

				const inPageProps = specialInPageProps[tab.name as SpecialTabName];
				inPageProps.curTab = (inPageProps.tabs.find((item) => item.url == tab.url) ?? inPageProps.tabs[0]).id;

				tabMapPage.value.set(newTab, newTab.name);
				pageMapInPageProps.value.set(newTab.name, inPageProps);
			}
		});

		updateItemTabPage(router.currentRoute.value.path, curTab.value.url, false);
	});

	watch(
		() => router.currentRoute.value,
		(newValue, oldValue) => {
			if (newValue.path === oldValue.path) {
				return;
			}
			updateItemTabPage(newValue.path, oldValue.fullPath, false);
		}
	);

	function determinIfNeedShrinkWhenResize() {
		var timeid: Optional<NodeJS.Timeout>;
		if (timeid) {
			clearTimeout(timeid);
			timeid = undefined;
		}
		if (autoShrink.value) {
			timeid = setTimeout(() => {
				if (!shrinked.value && document.body.clientWidth <= 1000) {
					shrinked.value = true;
				} else if (shrinked && document.body.clientWidth > 1000) {
					shrinked.value = false;
				}
			}, 100);
		}
	}

	function recordTabsWhenUnload() {
		if (!cookieStore.get("value")) {
			return;
		}

		cookieStore.set("shrinked", shrinked.value);
		cookieStore.set("autoShrink", autoShrink.value);
		cookieStore.set(
			"tabProps",
			Array.from(tabMapPage.value.keys()).map((item) => ({
				name: item.name,
				url: item.url,
			}))
		);
	}

	function updateItemTabPage(route: string, lastFullPath: string, itemClick?: boolean) {
		const entry = Array.from(pageMapInPageProps.value.entries()).find(
			([page, inPageProps]) => inPageProps.tabs.findIndex((item) => item.url === route) !== -1
		);
		let tab = entry ? tabMapPage.value.getByValue(entry[0]) : undefined;

		// 标签已关闭的情况，重新创建标签
		if (!tab) {
			const navItem = getNavItem(route);
			if (navItem) {
				// 如果当前路由对应的菜单类型为 Item，则直接创建主页面标签
				if (navItem.isItem()) {
					tab = createTab(navItem, route);

					// 当前路由对应的菜单类型为 Page
				} else {
					const parent = navItem.parent;

					// 查找该页内标签对应的主页面标签
					tab = tabMapPage.value.getByValue(`r${parent!.id}`);

					// 该页内标签对应的主页面标签已关闭，则根据当前路由和其父菜单创建主页面标签
					if (!tab) {
						tab = createTab(parent!, route);
					}
				}
			}
		}

		// 若主页面标签仍未空，则直接跳转错误页面
		if (!tab) {
			router.replace("error");
			return;
		}

		if (curTab.value.name !== tab.name) {
			curTab.value.lastRecordUrl = lastFullPath;
			curTab.value = tab;
			curNavItem.value = itemMapTab.value.getByValue(curTab.value, (l, r) => l.name == r.name);
			nextTick(() => {
				if (!itemClick && curNavItem.value) {
					sidebar.value.onLocateCurNavItem();
				}
				setTimeout(() => {
					curTab.value.element?.scrollIntoView({
						behavior: "smooth",
					});
				}, 100);

				// add selected class to curTab's parents' which has class nav-directory
				const tempEle = sidebar.value.$el.querySelector(".nav-item.selected") as any;
				let navItemComponentIns: Nullable<ComponentInternalInstance> = tempEle?.__vueParentComponent;
				while (navItemComponentIns && (navItemComponentIns = navItemComponentIns.parent)) {
					if (!navItemComponentIns.exposed || !navItemComponentIns.exposed.selected) {
						break;
					}
					navItemComponentIns.exposed.selected.value = true;
				}
			});
			curPage.value = tabMapPage.value.get(toRaw(curTab.value))!;
			curInPageProps.value = pageMapInPageProps.value.get(curPage.value)!;
		}

		curTab.value.url = route;
		curInPageProps.value.curTab = curInPageProps.value.tabs.find((item) => item.url === route)!.id;
		sidebar.value?.onLocateCurNavItem?.();
	}

	function getNavItem(id?: number | string) {
		if (id === undefined) {
			id = curNavItem.value;
		}

		if (id === 0 || id === "") {
			return null;
		}

		switch (typeof id) {
			case "number":
				return rawItems.find((val) => val.id == id) ?? null;
			case "string":
				return rawItems.find((val) => val.url == id) ?? null;
			default:
				return null;
		}
	}

	function createTab(navItem: Menu, inPageUrl?: string) {
		const name = `r${navItem.id}`;

		let title = "";
		let iter: Nullable<Menu> = navItem;
		while (iter) {
			title = iter.name + "-" + title;
			iter = iter.parent;
		}

		const newTab: ITab = {
			name: name,
			title: title.substring(0, title.length - 1),
			url: "",
		};

		const inPageProps: IInPageProps = {
			tabs: [],
			curTab: 0,
		};
		if (navItem.children) {
			navItem.children.forEach((child) => {
				inPageProps.tabs.push({
					id: child.id,
					name: child.name,
					url: child.url,
					icon: child.icon,
				});
			});
			if (inPageUrl && navItem.children.find((item) => item.url == inPageUrl)) {
				newTab.url = inPageUrl;
				inPageProps.curTab = (navItem.children.find((item) => item.url == inPageUrl) ?? navItem.children[0]).id;
			} else {
				const hasDefaultUrl = Boolean(navItem.url && navItem.url !== "/404");
				const defaultChildNav = hasDefaultUrl ? navItem.children.find((item) => item.url === navItem.url) : null;
				newTab.url = defaultChildNav?.url ?? navItem.children[0].url;
				inPageProps.curTab = defaultChildNav ? defaultChildNav.id : navItem.children[0].id;
			}
		} else {
			inPageProps.tabs.push({
				id: navItem.id,
				name: navItem.name,
				url: navItem.url,
			});
			newTab.url = navItem.url;
			inPageProps.curTab = navItem.id;
		}

		tabMapPage.value.set(newTab, name);
		pageMapInPageProps.value.set(name, inPageProps);
		return newTab;
	}

	function closeTab(tabProps: ITab) {
		if (tabProps.name != specialTabs.home.name) {
			if (curTab.value == tabProps) {
				const tabs = Array.from(tabMapPage.value.keys());
				const idx = tabs.findIndex((val) => val.name == tabProps.name) - 1;
				switchPage(tabs[idx], false);
				pageLoading.value = false;
			}
			itemMapTab.value.delete(itemMapTab.value.getByValue(tabProps, (fst, sec) => fst.name == sec.name));
			if (tabProps.name != specialTabs.personal.name) {
				const page = tabMapPage.value.get(tabProps);
				pageMapInPageProps.value.delete(page!);
			}
			curInPageProps.value.tabs.forEach((item) => delete item["lastQuery"]);
			tabMapPage.value.delete(tabProps);
		}
	}

	function switchPage(tabProps: ITab, itemClick: boolean, replaceRouter: boolean = false) {
		if (tabProps === curTab.value) {
			sidebar.value?.onLocateCurNavItem();
			return true;
		}

		// add selected class to curTab's parents' which has class nav-directory
		const tempEle = sidebar.value.$el.querySelector(".nav-item.selected") as any;
		let navItemComponentIns: Nullable<ComponentInternalInstance> = tempEle?.__vueParentComponent;
		while (navItemComponentIns && (navItemComponentIns = navItemComponentIns.parent)) {
			if (!navItemComponentIns.exposed || !navItemComponentIns.exposed.selected) {
				break;
			}
			navItemComponentIns.exposed.selected.value = false;
		}

		const url = tabProps.lastRecordUrl ?? tabProps.url;
		if (replaceRouter) {
			router.replace(url);
		} else {
			router.push(url);
		}
		return false;
	}

	function onInPageTabChange(tab: TabPaneName) {
		const oldInPageTab = curInPageProps.value.tabs.find((val) => val.url == curTab.value.url);
		const targetInPageTab = curInPageProps.value.tabs.find((val) => val.id == tab);

		if (!oldInPageTab || !targetInPageTab) {
			error("msg", { message: "切换标签失败！无法找到对应标签！" });
			return;
		}

		oldInPageTab.lastQuery = window.location.search;
		router.push(targetInPageTab.url + (targetInPageTab.lastQuery ?? ""));
	}
</script>

<template>
	<div class="main">
		<SideBar
			ref="sidebar"
			:items="treeItems"
			:class="{ shrinked: shrinked }"
		/>
		<div class="content">
			<div class="wrapper">
				<MenuBar />
				<TabBar />
				<ElTabs
					v-if="curInPageProps.tabs.length > 1"
					v-model="curInPageProps.curTab"
					@tab-change="onInPageTabChange"
				>
					<ElTabPane
						v-for="tab in curInPageProps.tabs"
						:key="tab.id"
						:label="tab.name"
						:name="tab.id"
					>
						<template #label>
							<IconFont
								v-if="tab.icon"
								:value="tab.icon"
							/>
							<span>{{ tab.name }}</span>
						</template>
					</ElTabPane>
				</ElTabs>
				<div
					class="page"
					id="page-loading"
					v-loading="pageLoading.value"
					element-loading-text="处理中..."
				>
					<RouterView
						v-for="item in pageMapInPageProps"
						:name="item[0]"
						v-slot="{ Component }"
					>
						<div
							class="inpage-tab-content"
							:key="curTab.key"
							:class="{ active: curPage == item[0] }"
						>
							<KeepAlive>
								<component :is="Component" />
							</KeepAlive>
						</div>
					</RouterView>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped lang="css">
	.main {
		height: 100%;
		display: flex;
		overflow: hidden;
	}

	.sidebar {
		/* Layout */
		width: 20em;
		display: inline-flex;
		flex-direction: column;
		flex-shrink: 0;

		/* Text */
		line-height: 3em;

		/* Appearance */
		background-color: #11101c;

		/* Animation */
		transition: width 0.3s ease-in-out;
	}
	.sidebar.shrinked {
		/* Layout */
		width: 3em;
	}
	.content {
		/* Layout */
		flex-grow: 1;
		overflow: auto;

		/* Appearance */
		color: #595959;
		background-color: white;

		/* Animation */
		transition: width 0.3s ease-in-out;
	}

	.content .wrapper {
		/* Text */
		display: inline-flex;
		flex-direction: column;
		overflow: hidden;
		width: 100%;
		height: 100%;
		min-width: 680px;
	}

	.wrapper .menubar,
	.wrapper .tabbar,
	.wrapper .page {
		line-height: 2.5em;
	}
	.wrapper .menubar {
		vertical-align: top;
	}
	.wrapper .page {
		/* Layout */
		flex-grow: 1;
		overflow: hidden;
		display: flex;
		position: relative;
		flex-direction: column;
	}
	.wrapper .el-tabs {
		padding: 0 20px;
	}

	.menubar :deep(.iconfont),
	.tabbar :deep(.iconfont) {
		width: 2.5em;
		cursor: pointer;
		vertical-align: top;
		transition: color 0.3s ease-in-out;
	}
	.menubar :deep(.iconfont:hover),
	.tabbar :deep(.iconfont:hover) {
		color: black;
		font-weight: bold;
	}

	.el-tabs :deep(.iconfont) {
		margin-right: 5px;
	}
	.el-tabs :deep(.el-tabs__item) {
		padding: 0 10px;
	}

	.page .inpage-tab-content {
		width: 100%;
		overflow: auto;
		position: absolute;
		display: none;
	}
	.page .inpage-tab-content.active {
		height: 100%;
		display: initial;
	}
</style>
