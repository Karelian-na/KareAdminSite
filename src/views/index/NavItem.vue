<!-- @format -->

<script setup lang="ts">
	import type { IMenuItem } from "@/views/menus";
	import type { CreateTabFunction, ITab, ItemTabMapType, SwitchPageFunction } from ".";

	import IconFont from "@/components/IconFont.vue";

	import { ref, inject, Ref } from "vue";
	import { MenuType } from "@/views/menus";
	import { Animation } from "@/common/utils/Animation";

	const props = defineProps<{
		navItem: IMenuItem;
	}>();

	const expanded = ref(false);
	const curTab = inject<Ref<ITab>>("curTab")!;
	const shrinked = inject<Ref<boolean>>("shrinked")!;
	const curNavItem = inject<Ref<number>>("curNavItem")!;
	const createTab = inject<CreateTabFunction>("createTab")!;
	const switchPage = inject<SwitchPageFunction>("switchPage")!;
	const itemMapTab = inject<Ref<ItemTabMapType>>("itemMapTab")!;

	function onNavItemClick(nav: IMenuItem) {
		if (nav.url != "#" && !nav.url.startsWith("/")) {
			window.open(nav.url);
		} else {
			const navId = nav.id;
			if (curNavItem.value != props.navItem.id) {
				let findedTab = itemMapTab.value.get(navId);
				if (!findedTab) {
					findedTab = createTab(props.navItem);
					itemMapTab.value.set(navId, findedTab);
				}
				switchPage(findedTab, true);
				curNavItem.value = navId;
			} else {
				curTab.value.element?.scrollIntoView({ behavior: "smooth" });
			}
		}
	}

	function onNavDirectoryTriggerClick(event: Event) {
		if (!shrinked.value) {
			const directory: HTMLLIElement = (event.currentTarget as HTMLLIElement).parentElement as HTMLLIElement;
			if (directory.classList.contains("expanded")) {
				Animation.dropDown(directory.querySelector("ul") as Animation.DropDownElement, 100, () => {
					expanded.value = !expanded.value;
				});
			} else {
				Animation.dropDown(directory.querySelector("ul") as Animation.DropDownElement, 100);
				expanded.value = !expanded.value;
			}
		}
	}
</script>

<template>
	<template v-if="navItem.type == MenuType.Menu">
		<li
			v-if="navItem.children && navItem.children.length != 0"
			class="nav-directory"
			:class="{ expanded: expanded }"
		>
			<div
				class="trigger"
				@click="onNavDirectoryTriggerClick"
			>
				<IconFont
					v-if="navItem.icon"
					:value="navItem.icon"
					:style="`--level:${navItem.level}`"
					:class="`level-${navItem.level}`"
				/>
				<a
					href="javascript: void(0);"
					:style="`--level:${navItem.level}`"
					:class="`level-${navItem.level}`"
					>{{ navItem.name }}
				</a>
				<IconFont value="expand" />
			</div>
			<ul>
				<NavItem
					v-for="item in navItem.children"
					:key="item.id"
					:navItem="item"
				/>
			</ul>
		</li>
	</template>
	<li
		v-else-if="!navItem.pid"
		class="nav-directory pseudo trigger"
		:class="{ selected: navItem.id == curNavItem }"
	>
		<IconFont
			v-if="navItem.icon"
			:value="navItem.icon"
		/>
		<ul>
			<li
				class="nav-item"
				:id="`item-${navItem.id}`"
				@click="onNavItemClick(navItem)"
			>
				<a
					:href="navItem.url == '#' ? (navItem.children ? navItem.children[0].url : '#') : navItem.url"
					:style="`--level:${navItem.level}`"
					:class="`level-${navItem.level}`"
					@click.stop.prevent="onNavItemClick(navItem)"
					>{{ navItem.name }}
				</a>
				<IconFont
					v-if="navItem.url != '#' && !navItem.url.startsWith('/')"
					value="external-link"
				/>
			</li>
		</ul>
	</li>
	<li
		v-else-if="navItem.url"
		class="nav-item"
		:id="`item-${navItem.id}`"
		:class="{ selected: navItem.id == curNavItem }"
		@click="onNavItemClick(navItem)"
	>
		<IconFont
			v-if="navItem.icon"
			:value="navItem.icon"
			:style="`--level:${navItem.level}`"
			:class="`level-${navItem.level}`"
		/>
		<a
			:href="navItem.url == '#' ? (navItem.children ? navItem.children[0].url : '#') : navItem.url"
			:style="`--level:${navItem.level}`"
			:class="`level-${navItem.level}`"
			@click.stop.prevent="onNavItemClick(navItem)"
			>{{ navItem.name }}</a
		>
		<IconFont
			v-if="navItem.url != '#' && !navItem.url.startsWith('/')"
			value="external-link"
		/>
	</li>
</template>

<style lang="css" scoped>
	.nav-directory {
		/* Layout */
		position: relative;
		overflow: hidden;
		color: #999999;
		background-color: #11101c;
	}
	.nav-directory:not(.pseudo):hover::before {
		/* Content Generater */
		content: "";

		/* Layout */
		position: absolute;
		height: 3em;
		width: 5px;

		/* Appearance */
		background-color: var(--el-color-primary);

		/* Animation */
		animation: height-ani 0.3s ease-in-out;
	}

	.nav-directory > ul {
		background-color: inherit;
	}
	.nav-directory:not(.pseudo) > ul {
		/* Layout */
		display: none;
	}
	.nav-directory.expanded > ul {
		/* Layout */
		display: block;
	}

	/* all menu icon */
	.trigger > :deep(.iconfont:first-child) {
		/* Layout */
		left: calc((var(--level) - 1) * 20px);
		position: absolute;
		z-index: 10;
	}
	/* sub menu icon special */
	.nav-directory > ul :deep(.iconfont:first-child) {
		width: unset;
		left: calc(2.5em + (var(--level) - 2) * 1em);
		position: absolute;
		z-index: 10;
	}

	.trigger {
		white-space: nowrap;
		/* Animation */
		transition: color 0.3s ease-in-out;
	}
	.nav-item,
	.trigger {
		/* Layout */
		height: 3em;
		cursor: pointer;
	}

	.nav-item:hover,
	.trigger:hover {
		/* Appearance */
		color: white;
	}

	/* operation icon, like expand, external-link */
	.trigger :deep(.iconfont:last-child),
	.nav-item :deep(.iconfont:last-child) {
		/* Layout */
		right: 0;
		position: absolute;

		/* Animation */
		transition: transform 0.1s ease-in-out;
	}

	.nav-directory.expanded > .trigger :deep(.icon-expand) {
		/* Other */
		transform: rotate(0.5turn);
	}

	.nav-item {
		/* Animation */
		transition: background-color 0.3s ease-in-out, color 0.3s ease-in-out;
	}

	.nav-item:hover,
	.nav-item.selected,
	.nav-directory.pseudo:hover,
	.nav-directory.pseudo.selected {
		/* Appearance */
		background-color: var(--el-color-primary);
		color: white;
	}
	.nav-directory.pseudo.selected .nav-item {
		background-color: var(--el-color-primary);
	}

	a {
		/* Layout */
		display: inline-block;
		white-space: nowrap;
		margin-left: calc(2em + var(--level) * 1.25em);

		/* Appearance */
		text-decoration: none;

		/* Animation */
		transition: padding-left 0.3s ease-in-out;
	}

	.nav-item :deep(.iconfont),
	.nav-directory :deep(.iconfont) {
		/* Animation */
		transition: padding-left 0.3s ease-in-out;
	}

	.nav-item:hover > :deep(.iconfont),
	.nav-item.selected > :deep(.iconfont),
	.nav-item:hover a,
	.nav-item.selected a,
	.nav-directory.pseudo:hover > :deep(.iconfont),
	.nav-directory.pseudo:hover a,
	.nav-directory.pseudo.selected > :deep(.iconfont),
	.nav-directory.pseudo.selected a {
		/* Layout */
		padding-left: 5px;

		/* Text */
		font-size: 1.04em;

		/* Appearance */
		color: white;
	}
	.shrinked .nav-directory.pseudo:hover > :deep(.iconfont),
	.shrinked .nav-directory.pseudo.selected > :deep(.iconfont) {
		padding-left: initial;
		font-size: initial;
	}

	.shrinked .nav-directory {
		/* Layout */
		overflow: initial;
	}
	.shrinked .nav-directory.pseudo:hover,
	.shrinked .nav-directory.pseudo.selected {
		background-color: #11101c;
	}
	.shrinked .nav-directory > ul > .nav-directory:first-child:hover::before,
	.shrinked .nav-directory > ul > .nav-directory:last-child:hover::before {
		/* Layout */
		height: 2.5em;
		animation: height-ani-first 0.3s ease-in-out;
	}
	.shrinked .nav-directory > ul > .nav-directory:first-child:hover::before {
		top: 0.5em;
	}

	.shrinked .nav-directory > ul,
	.shrinked .nav-directory:not(.pseudo) a.level-1,
	.shrinked a.level-1 + :deep(.icon-expand) {
		/* Layout */
		display: none;
	}

	/* all menu icon except top level when shrinked */
	.shrinked .nav-directory > ul :deep(.iconfont:first-child) {
		/* Layout */
		left: 1em;
	}

	.shrinked .nav-directory.pseudo:hover::before,
	.shrinked .nav-directory.pseudo.selected::before {
		/* Content Generater */
		content: "";

		/* Layout */
		position: absolute;
		height: 3em;
		width: 5px;

		/* Appearance */
		background-color: var(--el-color-primary);

		/* Animation */
		animation: height-ani 0.3s;
	}

	.shrinked .trigger :deep(.icon-expand) {
		/* Other */
		transform: rotate(0.75turn);
	}

	.shrinked .nav-directory > ul {
		/* Layout */
		top: 0;
		left: 100%;
		z-index: 10;
		width: 280px;
		padding-left: 5px;
		position: absolute;

		/* Appearance */
		background-clip: content-box;

		/* Other */
		border-radius: 1em;
	}
	.shrinked .nav-directory:hover > ul {
		/* Layout */
		display: initial;

		/* Animation */
		animation: shrinked-display-animation 0.3s ease-in-out;
		transform-origin: 0 0;
	}

	.shrinked .nav-directory:not(.pseudo):last-child,
	.shrinked .nav-item:last-child {
		/* Other */
		border-bottom-left-radius: 0.8em;
		border-bottom-right-radius: 1em;
	}
	.shrinked .nav-directory:not(.pseudo):first-child,
	.shrinked .nav-item:first-child {
		/* Other */
		border-top-left-radius: 0.8em;
		border-top-right-radius: 1em;
	}

	.shrinked .nav-item a,
	.shrinked .trigger a {
		/* Layout */
		margin-left: 3em;
	}

	@keyframes height-ani {
		from {
			height: 0;
		}
		to {
			height: 3em;
		}
	}

	@keyframes height-ani-first {
		from {
			height: 0;
		}
		to {
			height: 40px;
		}
	}

	@keyframes shrinked-display-animation {
		from {
			opacity: 0%;
			transform: scale(0.5);
		}
		to {
			opacity: 100%;
			transform: scale(1);
		}
	}
</style>
