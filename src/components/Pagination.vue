<!-- @format -->

<script setup lang="ts">
	import IconFont from "@/components/IconFont.vue";
	import AoButton from "@/components/AoButton.vue";
	import { ElInputNumber, ElSelect, ElOption } from "element-plus";

	import { onBeforeMount, ref } from "vue";
	import { error, info } from "@/common/utils/Interactive";

	const props = defineProps<{
		modelValue: {
			pageIdx: number;
			pageSize: number;
			dataCount: number;
		};
		pageSizes: number[];
		maxPageAmount: number;
		onChange(pageIdx: number, pageSize: number): boolean;
		onChanged?(): void;
	}>();

	const pageAmount = ref(Math.ceil(props.modelValue.dataCount / props.modelValue.pageSize));
	const startIdx = ref(1);
	const inputIdxValue = ref();
	const endIdx = ref(pageAmount.value <= props.maxPageAmount ? pageAmount.value : props.maxPageAmount);

	defineExpose({ pageAmount, refresh });

	onBeforeMount(refresh);

	function refresh() {
		pageAmount.value = Math.ceil(props.modelValue.dataCount / props.modelValue.pageSize);
		if (props.modelValue.pageIdx > pageAmount.value) {
			props.modelValue.pageIdx = pageAmount.value;
		} else if (props.modelValue.pageIdx == 0) {
			props.modelValue.pageIdx = 1;
		}
		if (props.modelValue.pageIdx < props.maxPageAmount || pageAmount.value <= props.maxPageAmount) {
			startIdx.value = 1;
			endIdx.value = pageAmount.value <= props.maxPageAmount ? pageAmount.value : props.maxPageAmount;
		} else if (pageAmount.value - props.modelValue.pageIdx <= 3) {
			startIdx.value = pageAmount.value - 6;
			endIdx.value = pageAmount.value;
		} else if (props.modelValue.pageIdx >= endIdx.value || props.modelValue.pageIdx <= startIdx.value) {
			startIdx.value = props.modelValue.pageIdx - 3;
			endIdx.value = props.modelValue.pageIdx + 3;
		}
		props.onChanged?.();
	}

	async function changePage(idx: number) {
		if (props.modelValue.pageIdx == idx) {
			return;
		}

		const old = props.modelValue.pageIdx;
		if (idx != -1) {
			props.modelValue.pageIdx = idx;
		}

		if (!props.onChange || props.onChange(props.modelValue.pageIdx, props.modelValue.pageSize)) {
			refresh();
		} else {
			props.modelValue.pageIdx = old;
		}
	}

	function jumpPage() {
		let idx = parseInt(inputIdxValue.value);
		if (isNaN(idx)) {
			error("msg", { message: "输入页码有误!" });
		} else if (idx < 1 || idx > pageAmount.value) {
			error("msg", { message: "请输入合法的页码值" });
		} else if (idx == props.modelValue.pageIdx) {
			info("msg", { message: "当前正在该页!" });
		} else {
			changePage(idx);
		}
	}
</script>

<template>
	<div
		v-show="pageAmount > 1"
		class="ui-pagination"
	>
		<AoButton
			v-if="startIdx != 1"
			@click="modelValue.pageIdx != 1 && changePage(1)"
			>首页</AoButton
		>
		<AoButton @click="modelValue.pageIdx > 1 && changePage(modelValue.pageIdx - 1)">
			<IconFont value="arrow-left" />
		</AoButton>
		<div class="pager">
			<AoButton
				v-for="idx in new Array(endIdx - startIdx + 1).fill(0).map((value, index) => startIdx + index)"
				class="page-index"
				:key="idx"
				:class="{ current: idx == modelValue.pageIdx }"
				@click="changePage(idx)"
				>{{ idx }}</AoButton
			>
		</div>
		<AoButton @click="modelValue.pageIdx < pageAmount && changePage(modelValue.pageIdx + 1)">
			<IconFont value="arrow-right" />
		</AoButton>
		<AoButton
			v-if="endIdx != pageAmount"
			@click="modelValue.pageIdx != pageAmount && changePage(pageAmount)"
			>尾页
		</AoButton>
		<ElInputNumber
			class="page-number"
			v-model="inputIdxValue"
			placeholder="输入页码"
			:controls="false"
			:min="1"
		/>
		<AoButton
			id="jump"
			@click="jumpPage"
			>跳转
		</AoButton>
		<span class="total">共 {{ modelValue.dataCount }} 条</span>
		<ElSelect
			v-model="modelValue.pageSize"
			class="page-size"
			@change="changePage(-1)"
		>
			<ElOption
				v-for="size in pageSizes"
				:value="size"
				:key="size"
				:label="`${size}条/每页`"
			/>
		</ElSelect>
	</div>
</template>

<style scoped lang="css">
	.ui-pagination {
		/* Layout */
		height: 1.8em;
		width: max-content;
		white-space: nowrap;
	}

	.ui-pagination .ui-button {
		padding: 0 0.5em;
	}
	.ui-pagination .ui-button:not(#jump) {
		/* Appearance */
		border: 1px solid #cdcdcd;
		background-color: transparent;
		transition: background-color 0.5s ease-in-out, color 0.5s ease-in-out;
	}
	.ui-pagination .ui-button:not(#jump):hover,
	.ui-pagination .ui-button:not(#jump).current {
		/* Appearance */
		opacity: 1;
		color: white;
		background-color: var(--el-color-primary);
	}
	.ui-pagination .ui-button:not(#jump).current {
		cursor: not-allowed;
	}

	.ui-pagination > * {
		height: 100%;
	}
	.ui-pagination > :deep(*:not(.pager)),
	.pager > .ui-button {
		vertical-align: top;
		margin-right: 5px;
		margin-left: 0;
		color: inherit;
	}
	.ui-pagination > .pager {
		/* Layout */
		display: inline-block;
		white-space: nowrap;
	}
	.ui-pagination > .ui-button#jump {
		color: white;
	}
	.ui-pagination > .total {
		display: inline-flex;
		align-items: center;
	}
	.ui-pagination > .el-input-number.page-number {
		/* Layout */
		width: 6em;
	}
	.ui-pagination > .el-select.page-size {
		/* Layout */
		width: 8.5em;
	}
	.ui-pagination > .el-select.page-size :deep(.el-select__wrapper) {
		/* Layout */
		min-height: unset;
		height: 100%;
	}

	.pager .ui-button {
		height: 100%;
	}
</style>
