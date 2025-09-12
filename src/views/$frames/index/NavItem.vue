<!-- @format -->

<script setup lang="ts">
	import type { Menu } from "@/views/$frames/menus";
	import type { CreateTabFunction, ITab, ItemTabMapType, SwitchPageFunction } from ".";

	import IconFont from "@/components/IconFont.vue";

	import { ref, inject, Ref } from "vue";
	import { Animation } from "@/common/utils/Animation";

	const props = defineProps<{
		navItem: Menu;
	}>();

	const expanded = ref(false);
	const selected = ref(false);
	const curTab = inject<Ref<ITab>>("curTab")!;
	const shrinked = inject<Ref<boolean>>("shrinked")!;
	const curNavItem = inject<Ref<number>>("curNavItem")!;
	const createTab = inject<CreateTabFunction>("createTab")!;
	const switchPage = inject<SwitchPageFunction>("switchPage")!;
	const itemMapTab = inject<Ref<ItemTabMapType>>("itemMapTab")!;

	defineExpose({ selected });

	function onNavItemClick(nav: Menu) {
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
	<template v-if="navItem.isMenu()">
		<li
			v-if="navItem.children && navItem.children.length != 0"
			class="nav-directory"
			:class="{ expanded: expanded, selected: selected }"
		>
			<div
				class="trigger"
				@click="onNavDirectoryTriggerClick"
			>
				<IconFont
					v-if="navItem.icon"
					:value="navItem.icon"
					:style="`--level:${navItem.level}`"
					:class="`left level-${navItem.level}`"
				/>
				<a
					href="javascript: void(0);"
					:style="`--level:${navItem.level}`"
					:class="`level-${navItem.level}`"
					>{{ navItem.name }}
				</a>
				<IconFont
					value="expand"
					class="right"
				/>
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
			class="left"
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
					class="right"
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
			:class="`left level-${navItem.level}`"
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
			class="right"
		/>
	</li>
</template>

<style lang="css" scoped>
	.nav-directory {
		/* Layout */
		position: relative;
		overflow: hidden;
		background-color: inherit;
	}
	.nav-directory:not(.pseudo):hover::before,
	.nav-directory:not(.pseudo).selected::before,
	.shrinked .nav-directory.pseudo:hover::before,
	.shrinked .nav-directory.pseudo.selected::before {
		/* Content Generater */
		content: "";

		/* Layout */
		position: absolute;
		height: 3em;
		width: 5px;

		/* Appearance */
		background-color: var(--primary-color);

		/* Animation */
		animation: height-ani var(--transition-duration);
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
	.trigger :deep(.iconfont.left) {
		/* Layout */
		left: calc((var(--level) - 1) * 20px);
		position: absolute;
		z-index: 10;
	}
	/* sub menu icon special */
	.nav-directory ul :deep(.iconfont.left) {
		width: unset;
		left: calc(2.5em + (var(--level) - 2) * 1em);
		position: absolute;
		z-index: 10;
	}

	.nav-item,
	.trigger {
		/* Layout */
		position: relative;
		height: 3em;
		cursor: pointer;
		transition: background-color var(--transition-duration) ease-in-out, color var(--transition-duration) ease-in-out;
	}
	.trigger:hover {
		/* Appearance */
		color: var(--hover-text-color);
	}
	.nav-item:hover,
	.nav-item.selected,
	.nav-directory.pseudo:hover,
	.nav-directory.pseudo.selected,
	.nav-directory.pseudo.selected .nav-item {
		background-color: var(--primary-color);
		color: var(--contrasted-text-color);
	}

	/* operation icon, like expand, external-link */
	.trigger :deep(.iconfont.right),
	.nav-item :deep(.iconfont.right) {
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

	a {
		/* Layout */
		display: inline-block;
		white-space: nowrap;
		margin-left: calc(2em + var(--level) * 1.25em);

		/* Appearance */
		text-decoration: none;

		/* Animation */
		transition: padding-left var(--transition-duration) ease-in-out;
	}

	.nav-item :deep(.iconfont),
	.nav-directory :deep(.iconfont) {
		transition: padding-left var(--transition-duration) ease-in-out, color var(--transition-duration) ease-in-out;
	}

	.nav-item:hover > *:not(.right),
	.nav-item.selected > *:not(.right),
	.nav-directory.pseudo:hover > :deep(.iconfont),
	.nav-directory.pseudo.selected > :deep(.iconfont),
	.nav-directory.pseudo.selected a,
	.shrinked .nav-directory.pseudo.selected a {
		/* Layout */
		padding-left: 5px;

		/* Text */
		font-size: 1.04em;
	}

	.shrinked .nav-directory.pseudo .nav-item {
		color: var(--text-color);
	}
	.shrinked .nav-directory.pseudo .nav-item:hover,
	.shrinked .nav-directory.pseudo.selected .nav-item {
		color: var(--contrasted-text-color);
	}
	.shrinked .nav-directory.pseudo:hover > :deep(.iconfont),
	.shrinked .nav-directory.pseudo.selected > :deep(.iconfont) {
		padding-left: initial;
		font-size: inherit;
		color: var(--hover-text-color);
	}

	.shrinked .nav-directory {
		/* Layout */
		overflow: initial;
	}
	.shrinked .nav-directory.pseudo:hover,
	.shrinked .nav-directory.pseudo.selected {
		background-color: inherit;
	}
	.shrinked .nav-directory .nav-directory:first-child:hover::before,
	.shrinked .nav-directory .nav-directory:last-child:hover::before {
		/* Layout */
		height: 2.5em;
		animation: height-ani-first var(--transition-duration) ease-in-out;
	}
	.shrinked .nav-directory .nav-directory:first-child:hover::before {
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

	.shrinked .trigger :deep(.iconfont.icon-expand) {
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
		background-color: inherit;
		filter: drop-shadow(0 0 2px var(--hover-border-color));

		/* Other */
		border-radius: 1em;
	}
	.shrinked .nav-directory:hover > ul {
		/* Layout */
		display: initial;

		/* Animation */
		animation: shrinked-display-animation var(--transition-duration) ease-in-out;
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
		margin-left: 2.5em;
	}
	.shrinked .nav-directory.pseudo a {
		/* Layout */
		margin-left: 1em;
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
