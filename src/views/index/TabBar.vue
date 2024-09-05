<!-- @format -->

<script setup lang="ts">
	import type { Ref } from "vue";
	import type { Optional } from "@/common/utils";
	import type { ILoading } from "@/common/utils/Interactive";
	import type { ItemTabMapType, TabPageMapType, ITab, SwitchPageFunction, CloseTabFunction } from ".";

	import IconFont from "@/components/IconFont.vue";

	import { CreateTabFunction, specialTabs } from ".";
	import { ref, inject } from "vue";
	import { EmptyObject } from "@/common/utils";
	import { error } from "@/common/utils/Interactive";

	let timeId: Optional<NodeJS.Timeout>;
	let direction: number;

	const optionDisplayed = ref(false);
	const tabContainer = ref<HTMLUListElement>(EmptyObject);

	const curTab = inject<Ref<ITab>>("curTab")!;
	const switchPage = inject<SwitchPageFunction>("switchPage")!;
	const closeTab = inject<CloseTabFunction>("closeTab")!;
	const tabMapPage = inject<Ref<TabPageMapType>>("tabMapPage")!;
	const itemMapTab = inject<Ref<ItemTabMapType>>("itemMapTab")!;

	function onTabScrollMouseDown(d: number) {
		direction = d;
		timeId = setInterval(scrollTabbar.bind(undefined, d), 100);
	}

	function scrollTabbar(d: number) {
		const container = tabContainer.value;
		const limit = d === 0 ? 0 : container.scrollWidth - container.clientWidth;
		const step = d === 0 ? -100 : 100;

		let to = container.scrollLeft + step;
		if (to < 0) {
			to = 0;
		} else if (d === 1 && to > limit) {
			to = limit;
		}

		container.scrollTo({
			behavior: "smooth",
			left: to,
		});
	}

	function onTabScrollMouseUp() {
		if (timeId) {
			clearInterval(timeId);
			timeId = undefined;
			scrollTabbar(direction);
		}
	}

	function tabCloseAllOnclick() {
		const tabs = Array.from(tabMapPage.value.keys());
		for (let idx = 1; idx < tabs.length; ++idx) {
			itemMapTab.value.delete(itemMapTab.value.getByValue(tabs[idx], (fst, sec) => fst.name == sec.name));
			tabMapPage.value.delete(tabs[idx]);
		}
		switchPage(tabs[0], false);
		optionDisplayed.value = false;
	}

	function tabCloseOthersOnclick() {
		let tabs: ITab[];
		if (curTab.value.name == specialTabs.home.name) {
			tabs = Array.from(tabMapPage.value.keys());
		} else {
			tabs = Array.from(tabMapPage.value.keys()).filter((val) => val.name != curTab.value.name);
		}
		for (let idx = 1; idx < tabs.length; ++idx) {
			itemMapTab.value.delete(itemMapTab.value.getByValue(tabs[idx], (fst, sec) => fst.name == sec.name));
			tabMapPage.value.delete(tabs[idx]);
		}
		optionDisplayed.value = false;
	}

	function tabCloseCurrentOnclick() {
		if (curTab.value.name == specialTabs.home.name) {
			error("msg", { message: "不能关闭该标签!" });
			return;
		}
		closeTab(curTab.value);
		optionDisplayed.value = false;
	}
</script>

<template>
	<div class="tabbar">
		<IconFont
			title="向前移动"
			value="double-arrow-left"
			@mousedown="onTabScrollMouseDown(0)"
			@mouseup="onTabScrollMouseUp"
		/>
		<ul
			ref="tabContainer"
			class="items"
		>
			<li
				class="item stable-home"
				:ref="(vnode) => (specialTabs.home.element = vnode as HTMLLIElement)"
				:class="{ 'tab-item-selected': curTab.name == specialTabs.home.name }"
				@click.stop.prevent="switchPage(specialTabs.home, false)"
			>
				<IconFont
					value="home"
					title="主页"
				/>
			</li>
			<li
				v-for="tab in Array.from(tabMapPage.keys()).filter((val) => val.name != 'home')"
				class="item"
				:ref="(vnode) => (tab.element = vnode as HTMLLIElement)"
				:key="tab.name"
				:class="{ 'tab-item-selected': curTab.name == tab.name }"
				@click="switchPage(tab, false)"
			>
				<span
					class="name"
					:title="tab.title"
					>{{ tab.title }}
				</span>
				<IconFont
					value="close"
					@click.stop.prevent="closeTab(tab)"
				/>
			</li>
		</ul>
		<IconFont
			title="向后移动"
			value="double-arrow-right"
			@mousedown="onTabScrollMouseDown(1)"
			@mouseup="onTabScrollMouseUp"
		/>
		<IconFont
			title="更多选项"
			value="more"
			@click="optionDisplayed = !optionDisplayed"
		/>
		<ul
			class="options"
			:class="{ display: optionDisplayed }"
		>
			<li
				class="item"
				@click="tabCloseAllOnclick"
			>
				关闭所有选项卡
			</li>
			<li
				class="item"
				@click="tabCloseCurrentOnclick"
			>
				关闭当前选项卡
			</li>
			<li
				class="item"
				@click="tabCloseOthersOnclick"
			>
				关闭其它选项卡
			</li>
		</ul>
	</div>
</template>

<style scoped lang="css">
	.tabbar {
		/* Layout */
		display: flex;
		position: relative;
	}

	.tabbar :deep(.icon-double-arrow-left),
	.tabbar :deep(.icon-double-arrow-right),
	.tabbar :deep(.icon-more) {
		flex-shrink: 0;
	}

	.tabbar .items {
		/* Layout */
		flex-grow: 1;
		overflow: hidden;
		white-space: nowrap;
	}

	.items .item {
		display: inline-block;
		position: relative;
		cursor: pointer;
	}
	.items .item:not(:first-of-type) {
		padding: 0 5px;
	}
	.items .item:hover,
	.items .item.tab-item-selected {
		/* Appearance */
		color: black;
	}

	.items .item:hover::before,
	.items .item.tab-item-selected::before {
		/* Content Generater */
		content: "";

		/* Layout */
		position: absolute;
		top: 0px;
		left: 0px;
		width: 100%;
		height: 0.15em;

		/* Appearance */
		background-color: var(--el-color-primary);

		/* Animation */
		animation: tip-ani 0.3s ease-in-out;
	}

	.items .item .name {
		vertical-align: top;
		margin-right: 0.1em;
	}

	.items .item :deep(.icon-close) {
		/* Layout */
		position: relative;
		width: 1em;
	}
	.items .item :deep(.icon-close):hover {
		/* Appearance */
		color: white;

		/* Animation */
		transition: color 0.3s ease-in-out;
	}
	/* make sure close icon is above background when hover */
	.items .item :deep(.icon-close)::before {
		/* Layout */
		position: relative;
		z-index: 1;
		display: block;
		transform: scale(0.6);
	}
	.items .item :deep(.icon-close:hover::after) {
		/* Content Generater */
		content: "";

		/* Layout */
		position: absolute;
		right: 0;
		top: 0;
		bottom: 0;
		margin: auto;
		width: 1em;
		height: 1em;

		/* Appearance */
		background-color: tomato;

		/* Animation */
		animation: bac-ani 0.3s;

		/* Other */
		border-radius: 50%;
	}

	.tabbar .icon-tab-right-scroll {
		/* Other */
		transform: rotate(0.5turn);
	}

	.tabbar .options {
		/* Layout */
		display: none;
		position: absolute;
		right: 0;
		top: 2.5em;
		margin: 5px;
		padding: 0 1em;
		z-index: 5;

		/* Appearance */
		border: 1px solid #aaaaaa;
		background-color: white;

		/* Other */
		border-radius: 5px;
	}
	.tabbar .options.display {
		/* Layout */
		display: initial;
	}

	.options .item {
		cursor: pointer;
	}
	.options .item:hover {
		color: black;
	}

	@keyframes tip-ani {
		from {
			margin: 0 50%;
			width: 0px;
		}
		to {
			margin: 0;
			width: 100%;
		}
	}

	@keyframes bac-ani {
		from {
			background-color: transparent;
		}
		to {
			background-color: tomato;
		}
	}
</style>
