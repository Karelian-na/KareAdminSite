<!-- @format -->

<script setup lang="ts">
	import type { Fields, IOperButton, OperbarButtonClickHandler } from "../templates";

	import AoButton from "@/components/AoButton.vue";
	import { ElForm, ElFormItem, ElInput, ElSelect, ElOption } from "element-plus";

	import { ref } from "vue";
	import { searchButton } from ".";

	const props = defineProps<{
		searchableFields: Fields;
		operButtons: Record<string, IOperButton>;
		onSearch?: () => void;
		defaultSearchField?: string;
		onOperbarButtonClick?: OperbarButtonClickHandler;
	}>();

	const searchKey = ref("");
	const searchField = ref(props.defaultSearchField && props.searchableFields[props.defaultSearchField] ? props.defaultSearchField : "");

	defineExpose({
		searchKey,
		searchField,
	});
</script>

<template>
	<div class="operationbar">
		<ElForm :inline="true">
			<slot v-bind="{ ...props, searchKey }">
				<template v-if="Object.entries(searchableFields).length != 0">
					<ElFormItem label="查询内容:">
						<ElInput
							v-model="searchKey"
							placeholder="输入查询内容"
						>
						</ElInput>
					</ElFormItem>
					<ElFormItem label="查询字段:">
						<ElSelect
							v-model="searchField"
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
