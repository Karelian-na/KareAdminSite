<!-- @format -->

<script setup lang="ts">
	import type { Menu } from "../menus";

	import NavItem from "./NavItem.vue";
	import IconFont from "@/components/IconFont.vue";

	import { inject, Ref } from "vue";
	import { KasConfig } from "@/configs";

	defineProps<{
		items: Array<Menu>;
	}>();

	const shrinked = inject<Ref<boolean>>("shrinked")!;
	const autoShrink = inject<Ref<boolean>>("autoShrink")!;
	const curNavItem = inject<Ref<number>>("curNavItem")!;

	defineExpose({ onLocateCurNavItem });

	function onScroll(e: WheelEvent) {
		// if (shrinked.value) {
		// 	var timeId: Optional<NodeJS.Timeout>;
		// 	if (timeId) {
		// 		clearTimeout(timeId);
		// 	}
		// 	const delta = e.deltaY / 10;
		// 	const navEle = e.currentTarget as HTMLDivElement;
		// 	const maxScrollTop = navEle.scrollHeight - navEle.clientHeight;
		// 	let top = 0;
		// 	navEle.style.overflow = "auto";
		// 	if (delta > 0) {
		// 		if (navEle.scrollTop === maxScrollTop) {
		// 			return;
		// 		} else if (navEle.scrollTop + delta >= maxScrollTop) {
		// 			top = maxScrollTop;
		// 		} else {
		// 			top = navEle.scrollTop + delta;
		// 		}
		// 	} else {
		// 		if (navEle.scrollTop === 0) {
		// 			return;
		// 		} else if (navEle.scrollTop + delta <= 0) {
		// 			top = 0;
		// 		} else {
		// 			top = navEle.scrollTop + delta;
		// 		}
		// 	}
		// 	console.log(top);
		// 	navEle.scrollTo({ top: top });
		// 	timeId = setTimeout(() => {
		// 		navEle.style.overflow = "initial";
		// 		timeId = undefined;
		// 	}, 500);
		// }
	}

	function onLocateCurNavItem() {
		if (!shrinked.value) {
			if (curNavItem.value) {
				let curNavItemElement = document.getElementById(`item-${curNavItem.value}`)!;
				var parentDirList = new Array();
				var curNavItemParent = curNavItemElement.parentElement;
				while (curNavItemParent) {
					if (curNavItemParent.tagName == "NAV") {
						break;
					} else if (curNavItemParent.classList.contains("nav-directory")) {
						if (!curNavItemParent.classList.contains("expanded")) {
							parentDirList.unshift(curNavItemParent.querySelector(".trigger") ?? curNavItemParent);
						}
					}
					curNavItemParent = curNavItemParent.parentElement;
				}
				parentDirList.forEach((item) => item.click());
				setTimeout(() => curNavItemElement.scrollIntoView({ behavior: "smooth" }), 500);
			}
		}
	}

	function onExpandAllNavDirectory() {
		const expandedDir = document.querySelectorAll<HTMLLIElement>(".sidebar .nav-directory.expanded>.trigger");
		if (expandedDir.length == 0) {
			document.querySelectorAll<HTMLLIElement>(".sidebar .nav-directory .trigger").forEach((item) => item.click());
		} else {
			expandedDir.forEach((item) => item.click());
		}
	}

	function onShrinkSidebar() {
		autoShrink.value = shrinked.value;
		shrinked.value = !shrinked.value;
	}
</script>

<template>
	<div class="sidebar">
		<header class="header">
			<div class="logo">
				<img :src="KasConfig.sysIcon" />
			</div>
			<h1 class="title">{{ KasConfig.sysTitle }}</h1>
		</header>
		<nav
			class="navigation"
			@mousewheel="onScroll"
		>
			<ul>
				<NavItem
					v-for="item in items"
					:key="item.id"
					:nav-item="item"
				>
				</NavItem>
			</ul>
		</nav>
		<div class="navigation-option">
			<IconFont
				@click="onShrinkSidebar"
				title="伸缩侧边栏"
				value="shrink"
			/>
			<IconFont
				@click="onLocateCurNavItem"
				title="跳转到当前选中的菜单"
				value="locate"
			/>
			<IconFont
				@click="onExpandAllNavDirectory"
				title="展开或收起所有菜单"
				value="expand-all"
			/>
		</div>
	</div>
</template>

<style scoped lang="css">
	.sidebar :deep(.iconfont) {
		/* Layout */
		width: 3em;
	}
	/* header */

	.sidebar .header {
		/* couldn't wrap when shrink */
		white-space: nowrap;
		overflow: hidden;
		flex-shrink: 0;

		color: var(--hover-text-color);
		height: 3em;
	}

	.header .logo {
		/* Layout */
		width: 1.5em;
		height: 1.5em;
		flex-shrink: 0;
		display: inline-flex;

		justify-content: center;
		align-items: center;
		/* Text */
		font-size: 2em;
		vertical-align: top;
		text-align: center;
	}

	.logo img {
		width: 1em;
	}

	.header .title {
		/* Layout */
		display: inline;

		/* Text */
		font: normal bold 1.2em/48px "consolas";
	}

	/* navigation 开始  */
	.navigation {
		/* Layout */
		min-height: 18em;
		flex-grow: 1;
		overflow: hidden auto;
		background-color: inherit;
	}
	.navigation::-webkit-scrollbar {
		/* Layout */
		display: none;
	}
	.navigation > ul {
		background-color: inherit;
	}

	.navigation-option {
		/* Layout */
		white-space: nowrap;
		overflow: hidden;
		text-align: center;
		flex-shrink: 0;
		background-color: inherit;
		z-index: 10;

		/* Animation */
		transition: padding-left var(--transition-duration) ease-in-out;
	}
	.navigation-option :deep(.iconfont) {
		/* Text */
		width: 2em;
		font-size: 1.5em;
		margin: 0 1em;
		cursor: pointer;
		vertical-align: top;
		transition: color var(--transition-duration) ease-in-out;
	}
	.navigation-option :deep(.iconfont:hover) {
		color: var(--hover-text-color);
	}
	.navigation-option :deep(.icon-shrink) {
		/* Layout */
		transition: color var(--transition-duration) ease-in-out, transform var(--transition-duration) ease-in-out, margin 0.3s ease-in-out;
	}

	.shrinked .header .title {
		/* Layout */
		display: none;
	}
	.shrinked .navigation {
		/* Layout */
		overflow: initial;
	}
	.shrinked .search {
		padding-left: 0;
	}
	.shrinked .search :deep(.el-input-group__prepend) {
		box-shadow: none;
	}
	.shrinked .navigation-option {
		/* Layout */
		padding-left: 0;
	}
	.shrinked .navigation-option :deep(.icon-shrink) {
		/* Layout */
		margin: 0;
		transform: rotate(0.5turn);
	}
</style>
