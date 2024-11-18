<!-- @format -->

<script setup lang="ts">
	import type { IPaginationModeValue, PaginationChangeCallback, PaginationRefreshCallback } from ".";

	import IconFont from "@/components/IconFont.vue";
	import AoButton from "@/components/AoButton.vue";
	import { ElInputNumber, ElSelect, ElOption } from "element-plus";

	import { computed, ref } from "vue";
	import { error, info } from "@/common/utils/Interactive";

	const props = defineProps<{
		modelValue: IPaginationModeValue;
		pageSizes: number[];
		maxPageAmount: number;
		onChange: PaginationChangeCallback;
		onChanged?: PaginationChangeCallback;
	}>();

	const dataCount = ref(0);
	const pageAmount = computed(() => {
		if (!dataCount.value) {
			return 1;
		}
		const result = Math.ceil(dataCount.value / props.modelValue.pageSize);
		return isNaN(result) ? 1 : result;
	});
	const startIdx = computed(() => {
		if (!props.modelValue.pageIdx) {
			return 1;
		}

		const halfMaxPageNumber = Math.floor(props.maxPageAmount / 2);
		if (props.modelValue.pageIdx < props.maxPageAmount || pageAmount.value <= props.maxPageAmount) {
			return 1;
		} else if (pageAmount.value - props.modelValue.pageIdx <= halfMaxPageNumber) {
			return pageAmount.value - props.maxPageAmount;
		}
		return props.modelValue.pageIdx - halfMaxPageNumber;
	});
	const endIdx = computed(() => {
		if (!props.modelValue.pageIdx) {
			return 1;
		}

		const halfMaxPageNumber = Math.floor(props.maxPageAmount / 2);
		if (props.modelValue.pageIdx < props.maxPageAmount || pageAmount.value <= props.maxPageAmount) {
			return pageAmount.value <= props.maxPageAmount ? pageAmount.value : props.maxPageAmount;
		} else if (pageAmount.value - props.modelValue.pageIdx <= halfMaxPageNumber) {
			return pageAmount.value;
		}

		return props.modelValue.pageIdx + halfMaxPageNumber;
	});
	const inputIdxValue = ref();

	const refresh: PaginationRefreshCallback = function (data) {
		dataCount.value = data.totalCount;
		props.modelValue.pageIdx = data.curPageIdx;
		props.modelValue.pageSize = data.pageSize;

		if (props.modelValue.pageIdx > pageAmount.value) {
			props.modelValue.pageIdx = pageAmount.value;
		} else if (props.modelValue.pageIdx == 0) {
			props.modelValue.pageIdx = 1;
		}
		props.onChanged?.(props.modelValue, data);
	};

	defineExpose({ pageAmount, refresh });

	async function changePage(idx: number) {
		if (props.modelValue.pageIdx == idx) {
			return;
		}

		props.onChange?.({ pageIdx: idx === -1 ? props.modelValue.pageIdx ?? 1 : idx, pageSize: props.modelValue.pageSize });
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
		v-if="pageAmount > 0"
		class="ui-pagination"
	>
		<AoButton
			v-if="startIdx != 1"
			@click="modelValue.pageIdx != 1 && changePage(1)"
			>首页</AoButton
		>
		<AoButton
			:props="{ disabled: !modelValue.pageIdx || modelValue.pageIdx === 1 }"
			@click="changePage(modelValue.pageIdx! - 1)"
		>
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
		<AoButton
			:props="{ disabled: !modelValue.pageIdx || modelValue.pageIdx === pageAmount }"
			@click="changePage(modelValue.pageIdx! + 1)"
		>
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
		<span class="total">共 {{ dataCount }} 条</span>
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
	.ui-pagination .ui-button:not(#jump):not(:disabled):hover,
	.ui-pagination .ui-button:not(#jump):not(:disabled).current {
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
