<!-- @format -->

<script setup lang="ts">
	import type { IField } from ".";
	import type { ComputedRef } from "vue";
	import type { UploadUserFile } from "element-plus";
	import type { IPreviewDialogProps } from "@/common";

	import KUpload from "@/components/KUpload.vue";
	import {
		ElFormItem,
		ElInput,
		ElSelect,
		ElOption,
		ElInputNumber,
		ElDatePicker,
		ElRadioGroup,
		ElRadio,
		ElSwitch,
		ElTimeSelect,
		ElCheckbox,
		ElSlider,
	} from "element-plus";
	import JsonPretty from "vue-json-pretty";

	import { TemplateUtils } from ".";
	import { computed, inject, onBeforeMount, ref, watch } from "vue";

	const mode = inject<ComputedRef<string>>("mode")!;
	const previewDialogProps = inject<IPreviewDialogProps>("previewDialogProps")!;

	type EditItemValueType = string | number | boolean | Date | Array<UploadUserFile> | Object;

	const props = defineProps<{
		field: IField;

		modelValue?: EditItemValueType;
	}>();

	const emits = defineEmits<{
		(e: "update:modelValue", value?: EditItemValueType): void;
	}>();

	const disabled = computed(() => {
		if (mode.value === "details") {
			return true;
		}

		if (props.field.editable) {
			return false;
		}

		if (mode.value === "add") {
			return !props.field.editable_when_add;
		}

		return true;
	});

	const internalModelValue = ref<EditItemValueType>(props.modelValue!);
	const uploadIns = ref<InstanceType<typeof KUpload>>();

	defineExpose({ uploadIns, field: props.field });

	watch(
		() => props.modelValue,
		(newVal) => {
			switch (props.field.config.type) {
				case "json":
					internalModelValue.value = JSON.parse(newVal as string);
					break;
				default:
					break;
			}

			internalModelValue.value = newVal as any;
		}
	);

	onBeforeMount(() => {
		switch (props.field.config.type) {
			case "switch":
				internalModelValue.value = !!props.modelValue;
				break;
			case "json":
				internalModelValue.value = JSON.parse(props.modelValue as string);
				break;
			default:
				break;
		}

		if (!props.field.config.bindProps) {
			props.field.config.bindProps = {};
		}
		const bindProps = props.field.config.bindProps;
		switch (props.field.config.type) {
			case "enum":
			case "date":
				if (!bindProps.placeholder) bindProps.placeholder = `请选择${props.field.display_name}`;
				break;
			case "text":
			case "number":
				if (!bindProps.placeholder) bindProps.placeholder = `请输入${props.field.display_name}`;
				break;
			case "checkbox":
				bindProps.label = props.field.display_name;
			default:
				break;
		}
	});

	function onInternalModelValueChanged(newVal: any) {
		if (!Array.isArray(newVal) || newVal.length !== 0) {
			emits("update:modelValue", newVal);
		}
	}

	function isEmptyValue() {
		return props.modelValue === undefined || (Array.isArray(props.modelValue) && !props.modelValue.length);
	}
</script>

<template>
	<ElFormItem
		class="edit-item"
		:class="field.field_name"
		:prop="field.field_name"
		:label="field.config.type === 'checkbox' ? '' : field.display_name + ':'"
		v-bind="Object.assign({}, $attrs, field.config.itemBindProps)"
	>
		<span
			v-if="disabled && isEmptyValue() && !['image', 'custom'].includes(field.config.type)"
			class="readonly no-value-tip"
			>暂未设置
		</span>
		<slot
			v-else
			:field="field"
			:disabled="disabled"
		>
			<template v-if="disabled && !['image', 'file'].includes(field.config.type!)">
				<slot
					name="display"
					:field="field"
				>
					<JsonPretty
						v-if="field.config.type === 'json'"
						:data="(internalModelValue as string)"
					/>
					<span
						v-else
						class="readonly"
					>
						<template v-if="['enum', 'radio', 'switch'].includes(field.config.type!)">{{
							TemplateUtils.mapDataValueToLabel(field, modelValue as any)
						}}</template>
						<template v-else>{{ modelValue }}</template>
					</span>
				</slot>
			</template>
			<template v-else>
				<slot
					name="input"
					:field="field"
				>
					<ElInput
						v-if="field.config.type == 'text'"
						:model-value="internalModelValue"
						:disabled="disabled"
						@update:model-value="onInternalModelValueChanged"
						v-bind="field.config.bindProps"
					>
						<template
							v-if="$slots['prepend']"
							#prepend
						>
							<slot name="prepend"></slot>
						</template>
					</ElInput>
					<ElInputNumber
						v-else-if="field.config.type == 'number'"
						:model-value="internalModelValue"
						:disabled="disabled"
						@update:model-value="onInternalModelValueChanged"
						v-bind="field.config.bindProps"
					/>
					<ElCheckbox
						v-else-if="field.config.type == 'checkbox'"
						:model-value="internalModelValue"
						:disabled="disabled"
						@update:model-value="onInternalModelValueChanged"
						v-bind="field.config.bindProps"
					/>
					<ElSelect
						v-else-if="field.config.type == 'enum'"
						:model-value="internalModelValue"
						:disabled="disabled"
						@update:model-value="onInternalModelValueChanged"
						v-bind="field.config.bindProps"
					>
						<template v-if="field.config.tempEnumItems ?? field.config.enumItems">
							<ElOption
								v-for="item in field.config.tempEnumItems ?? field.config.enumItems"
								:label="item.label"
								:value="item.value"
								:disabled="(item.disabled as any)"
							>
								<slot
									name="options"
									v-bind="item"
								></slot>
							</ElOption>
						</template>
					</ElSelect>
					<ElRadioGroup
						v-else-if="field.config.type == 'radio'"
						:model-value="internalModelValue"
						:disabled="disabled"
						@update:model-value="onInternalModelValueChanged"
						v-bind="field.config.bindProps"
					>
						<template v-if="field.config.tempEnumItems ?? field.config.enumItems">
							<ElRadio
								v-for="item in field.config.tempEnumItems ?? field.config.enumItems"
								:label="item.value"
								>{{ item.label }}
							</ElRadio>
						</template>
					</ElRadioGroup>
					<ElSwitch
						v-else-if="field.config.type == 'switch'"
						:model-value="internalModelValue"
						:disabled="disabled"
						@update:model-value="onInternalModelValueChanged"
						v-bind="field.config.bindProps"
					/>
					<ElDatePicker
						v-else-if="field.config.type == 'date'"
						:model-value="internalModelValue"
						:disabled="disabled"
						@update:model-value="onInternalModelValueChanged"
						v-bind="field.config.bindProps"
					/>
					<ElTimeSelect
						v-else-if="field.config.type == 'time'"
						:model-value="internalModelValue"
						:disabled="disabled"
						@update:model-value="onInternalModelValueChanged"
						v-bind="field.config.bindProps"
					/>
					<KUpload
						v-else-if="field.config.type == 'image' || field.config.type == 'file'"
						ref="uploadIns"
						:disabled="disabled"
						:type="field.config.type"
						:model-value="internalModelValue"
						:image-prev-dialog-props="previewDialogProps"
						@update:model-value="onInternalModelValueChanged"
						v-bind="field.config.bindProps"
					/>
					<ElSlider
						v-else-if="field.config.type == 'slider'"
						:model-value="internalModelValue"
						:disabled="disabled"
						@update:model-value="onInternalModelValueChanged"
						v-bind="field.config.bindProps"
					/>
				</slot>
			</template>
		</slot>
		<slot name="extra"></slot>
	</ElFormItem>
</template>

<style scoped lang="css">
	:global(.edit-item .el-form-item__content > *:first-child:not(.ao-upload.image)) {
		width: 100%;
		height: 100%;
	}

	.edit-item :deep(.el-form-item__content > span) {
		white-space: nowrap;
	}

	.edit-item :deep(.vjs-tree) {
		padding-top: 0.5em;
	}

	.edit-item :deep(.el-form-item__content > span.readonly) {
		white-space: pre-wrap;
		max-height: 20em;
		width: 100%;
		overflow-y: auto;
	}
	.edit-item .no-value-tip {
		color: gray;
	}
</style>
