<!-- @format -->

<script setup lang="ts">
	import type { IPositionedPageModelValue, PaginationChangeCallback, PaginationRefreshCallback } from ".";

	import AoButton from "@/components/AoButton.vue";
	import { ElSelect, ElOption } from "element-plus";

	import { ref } from "vue";
	import { PageDirection, Paginations } from ".";

	const props = defineProps<{
		modelValue: IPositionedPageModelValue;
		pageSizes: number[];
		onChange: PaginationChangeCallback<IPositionedPageModelValue>;
		onChanged?(): void;
	}>();

	let pageStartPos: string;
	let pageEndPos: string;

	const dataCount = ref(0);

	const refresh: PaginationRefreshCallback = function (pageData) {
		props.modelValue.pageSize = pageData.pageSize ?? Paginations.defaultPageSize;

		const data = pageData.data;
		if (!Array.isArray(data) || !data.length) {
			dataCount.value = 0;
			pageStartPos = pageEndPos = "";
			return;
		}

		dataCount.value = data.length;
		pageStartPos = data[0]["page_pos"];
		pageEndPos = data[data.length - 1]["page_pos"];
	};

	defineExpose({ refresh });

	async function changePage(direction?: PageDirection) {
		if (direction === undefined) {
			props.onChange({ page_pos: "", direction: PageDirection.NEXT, pageSize: props.modelValue.pageSize });
			return;
		}

		const page_pos = direction === PageDirection.NEXT ? pageEndPos : pageStartPos;
		props.onChange({ page_pos, direction, pageSize: props.modelValue.pageSize });
	}
</script>

<template>
	<div class="ui-pagination">
		<AoButton
			:props="{ disabled: !modelValue.page_pos }"
			@click="changePage()"
			>首页
		</AoButton>
		<AoButton
			:props="{ disabled: !modelValue.page_pos }"
			@click="changePage(PageDirection.PREV)"
			>上一页
		</AoButton>
		<AoButton
			:props="{ disabled: dataCount < modelValue.pageSize }"
			@click="changePage(PageDirection.NEXT)"
		>
			下一页
		</AoButton>
		<span class="total">本页 {{ dataCount }} 条</span>
		<ElSelect
			v-model="modelValue.pageSize"
			class="page-size"
			@change="changePage()"
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
		margin-top: 0.5em;
	}

	.ui-pagination .ui-button {
		padding: 0 0.5em;
	}
	.ui-pagination .ui-button {
		/* Appearance */
		border: 1px solid #cdcdcd;
		background-color: transparent;
		transition: background-color 0.5s ease-in-out, color 0.5s ease-in-out;
	}
	.ui-pagination .ui-button:not(:disabled):hover,
	.ui-pagination .ui-button:not(:disabled).current {
		/* Appearance */
		opacity: 1;
		color: white;
		background-color: var(--el-color-primary);
	}
	.ui-pagination .ui-button.current {
		cursor: not-allowed;
	}

	.ui-pagination > * {
		height: 100%;
	}
	.ui-pagination > *,
	.pager > .ui-button {
		vertical-align: top;
		margin-right: 5px;
		margin-left: 0;
		color: inherit;
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

	.ui-pagination > .total {
		display: inline-flex;
		align-items: center;
	}
</style>
