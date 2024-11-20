<!-- @format -->

<script setup lang="ts">
	import type { Fields, IOperButton, OperbarButtonClickHandler } from "../templates";

	import AoButton from "@/components/AoButton.vue";
	import { ElForm, ElFormItem, ElInput, ElSelect, ElOption } from "element-plus";

	import { searchButton } from ".";
	import { onBeforeMount, onUpdated } from "vue";

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

	onBeforeMount(regularSearchKey);
	onUpdated(regularSearchKey);

	function onSearchFieldChange(newValue: any) {
		props.modelValue.searchKey = "";
	}

	function regularSearchKey() {
		if (!props.modelValue.searchField || !props.modelValue.searchKey) {
			return;
		}

		const fieldConfig = props.searchableFields[props.modelValue.searchField]?.config;
		if (!fieldConfig) {
			return;
		}

		if (["enum", "radio"].includes(fieldConfig.type)) {
			const item = fieldConfig.enumItems?.find((item) => item.value == props.modelValue.searchKey);
			if (item) {
				props.modelValue.searchKey = item.value as any;
			}
		}
	}
</script>

<template>
	<div class="operationbar">
		<ElForm :inline="true">
			<slot v-bind="{ ...props }">
				<template v-if="Object.entries(searchableFields).length != 0">
					<ElFormItem label="查询内容:">
						<ElSelect
							v-if="modelValue.searchField && ['enum', 'radio'].includes(searchableFields[modelValue.searchField].config.type)"
							v-model="modelValue.searchKey"
							placeholder="请选择查询内容"
						>
							<ElOption
								label="[选择查询内容]"
								value=""
							/>
							<template v-if="searchableFields[modelValue.searchField].config.enumItems">
								<ElOption
									v-for="item in searchableFields[modelValue.searchField].config.enumItems"
									:key="(item.value as any)"
									:value="item.value"
									:label="item.label"
								/>
							</template>
						</ElSelect>
						<ElInput
							v-else
							placeholder="输入查询内容"
							v-model="modelValue.searchKey"
							@keyup.enter="onOperbarButtonClick?.(searchButton, operButtons)"
						>
						</ElInput>
					</ElFormItem>
					<ElFormItem label="查询字段:">
						<ElSelect
							v-model="modelValue.searchField"
							placeholder="选择查询字段"
							@change="onSearchFieldChange"
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
