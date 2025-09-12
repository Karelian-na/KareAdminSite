<!-- @format -->

<script setup lang="ts">
	import type { IPositionedPageModelValue, PaginationChangeCallback, PaginationRefreshCallback } from ".";

	import KButton from "@/components/KButton.vue";
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
		<KButton
			:props="{ disabled: !modelValue.page_pos }"
			@click="changePage()"
			>首页
		</KButton>
		<KButton
			:props="{ disabled: !modelValue.page_pos }"
			@click="changePage(PageDirection.PREV)"
			>上一页
		</KButton>
		<KButton
			:props="{ disabled: dataCount < modelValue.pageSize }"
			@click="changePage(PageDirection.NEXT)"
		>
			下一页
		</KButton>
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
		width: max-content;
		display: flex;
		gap: 5px;
		line-height: 2em;
		margin-top: 0.5em;
	}

	.ui-button {
		height: inherit;
		border-color: var(--border-color);
		color: var(--text-color);
		background-color: transparent;
		margin: 0;
		padding: 0.5em;
		transition: background-color var(--transition-duration) ease-in-out, color var(--transition-duration) ease-in-out;
	}
	.ui-button:not(:disabled):hover,
	.ui-button:not(:disabled).current {
		/* Appearance */
		opacity: 1;
		color: var(--contrasted-text-color);
		background-color: var(--primary-color);
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
</style>
