<!-- @format -->

<script setup lang="ts">
	import IconFont from "./IconFont.vue";

	import { ref, watch } from "vue";
	import { EmptyObject } from "@/common/utils";
	import { ElPopover, vLoading } from "element-plus";

	import axios from "axios";

	const props = defineProps<{
		reqUrl?: string;
		modelValue?: string;
	}>();

	const allIcons = new Array<string>();

	const container = ref<HTMLDivElement>(EmptyObject);
	const icons = ref<string[]>([]);

	const emits = defineEmits<{
		(e: "update:model-value", value: string): void;
	}>();

	watch(
		() => props.modelValue,
		(newVal, oldVal) => {
			if (!newVal || oldVal === undefined) {
				icons.value = allIcons;
				return;
			}
			icons.value = allIcons.reduce((prev, cur) => {
				if (cur.includes(newVal)) {
					prev.push(cur);
				}
				return prev;
			}, new Array<string>());
		}
	);

	if (props.reqUrl) {
		axios
			.get<{ glyphs: { font_class: string }[] }>(props.reqUrl, {
				withCredentials: false,
			})
			.then((result) => {
				const iconfonts = result.data;
				allIcons.reset(iconfonts.glyphs.map((val) => val.font_class));
				icons.value = allIcons;
			});
	}

	function onAfterEnter() {
		container.value.querySelector(".selected")?.scrollIntoView();
	}

	function onSelect(val: string) {
		if (props.modelValue != val) {
			emits("update:model-value", val);
		}
	}
</script>

<template>
	<ElPopover
		width="400px"
		trigger="click"
		placement="bottom-end"
		:popper-style="{ height: '300px', 'overflow-y': 'hidden' }"
		@after-enter="onAfterEnter"
	>
		<template #reference>
			<slot></slot>
		</template>
		<div
			ref="container"
			class="icons-container"
			v-loading="!allIcons.length"
			element-loading-text="处理中..."
		>
			<IconFont
				value=""
				:class="{ selected: '' == modelValue }"
				@click="onSelect('')"
			/>
			<IconFont
				v-for="icon in icons"
				:value="icon"
				:class="{ selected: icon == modelValue }"
				@click="onSelect(icon)"
			>
			</IconFont>
		</div>
	</ElPopover>
</template>

<style scoped>
	.icons-container {
		height: 100%;
		overflow: auto;
	}

	.icons-container :deep(.iconfont) {
		vertical-align: middle;
		font-size: 16px;
		width: 35px;
		height: 35px;
		line-height: 35px;
		cursor: pointer;
		border: 1px solid var(--el-border-color);
		border-radius: 5px;
		margin: 5px;
		transition: opacity 0.3s ease-in-out;
		box-sizing: border-box;
	}

	.icons-container :deep(.iconfont:hover) {
		opacity: 0.5;
	}

	.icons-container :deep(.iconfont.selected) {
		border-color: var(--el-color-primary);
		color: var(--el-color-primary);
	}
</style>
