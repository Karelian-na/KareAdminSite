<!-- @format -->

<script setup lang="ts">
	import type { Fields, IOperButton, OperbarButtonClickHandler } from "../templates";

	import AoButton from "@/components/AoButton.vue";
	import { ElForm, ElFormItem, ElInput, ElSelect, ElOption } from "element-plus";

	import { searchButton } from ".";

	interface ISearchProps extends Record<string, any> {
		searchKey?: string;
		searchField?: string;
	}

	const props = defineProps<{
		modelValue: ISearchProps;

		searchableFields: Fields;
		operButtons: Record<string, IOperButton>;
		onSearch?: () => void;
		onOperbarButtonClick?: OperbarButtonClickHandler;
	}>();

	defineEmits<{
		(e: "update:model-value", v: string): void;
	}>();
</script>

<template>
	<div class="operationbar">
		<ElForm :inline="true">
			<slot v-bind="{ ...props }">
				<template v-if="Object.entries(searchableFields).length != 0">
					<ElFormItem label="查询内容:">
						<ElInput
							placeholder="输入查询内容"
							:model-value="modelValue.searchKey"
							@update:model-value="(v) => (modelValue.searchKey = v)"
							@keyup.enter="onOperbarButtonClick?.(searchButton, operButtons)"
						>
						</ElInput>
					</ElFormItem>
					<ElFormItem label="查询字段:">
						<ElSelect
							:model-value="modelValue.searchField"
							@update:model-value="(v) => (modelValue.searchField = v)"
							placeholder="选择查询字段"
						>
							<ElOption
								value=""
								label="选择查询字段"
								>[选择查询字段]</ElOption
							>
							<ElOption
								v-for="field in Object.entries(searchableFields)"
								:key="field[0]"
								:value="field[0]"
								:label="field[1].display_name"
							/>
						</ElSelect>
					</ElFormItem>
					<ElFormItem>
						<AoButton
							:class="searchButton.type"
							:icon="searchButton.icon"
							@click="onOperbarButtonClick!(searchButton, operButtons)"
							>{{ searchButton.title }}
						</AoButton>
					</ElFormItem>
				</template>
			</slot>
			<ElFormItem v-for="button in operButtons">
				<AoButton
					:class="button.type"
					:icon="button.icon"
					:props="button.props"
					@click="onOperbarButtonClick!(button, operButtons)"
					>{{ button.title }}
				</AoButton>
			</ElFormItem>
		</ElForm>
	</div>
</template>

<style scoped lang="css">
	.operationbar :deep(.el-form-item) {
		height: 2em;
		margin-right: 0.3em;
		margin-bottom: 0.5em;
	}

	.operationbar :deep(.el-form-item__content > .ui-button) {
		padding: 0 0.5em;
	}

	.operationbar :deep(.el-form-item__content > *) {
		height: 100%;
	}

	.operationbar :deep(.el-form-item__content > .el-select),
	.operationbar :deep(.el-form-item__content > .el-input) {
		width: 9.5em;
	}
</style>
