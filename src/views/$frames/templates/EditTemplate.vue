<!-- @format -->

<script setup lang="ts">
	import type { Ref } from "vue";
	import type KUpload from "@/components/KUpload.vue";
	import type { Result } from "@/common/utils/Result";
	import type { FormInstance, FormRules } from "element-plus";
	import type { KeyStringObject, Optional } from "@/common/utils";
	import type { DataChangedCallback, EditTemplateProps, IField } from ".";

	import EditItem from "./EditItem.vue";
	import { ElForm, ElButton, ElRow, ElCol, ElFormItem } from "element-plus";

	import { CollectEnd } from ".";
	import { EmptyObject } from "@/common/utils";
	import { ObjectUtils } from "@/common/utils/Object";
	import { axiosRequest } from "@/common/utils/Network";
	import { confirm, error, info, success } from "@/common/utils/Interactive";
	import { onBeforeMount, onMounted, provide, ref, toRaw, watch, nextTick, computed } from "vue";

	const props = defineProps<EditTemplateProps>();

	const rules = ref<FormRules>();
	const initFormData: KeyStringObject = {};

	const labelWidth = ref(2);
	const layouts = ref<Array<string[]>>([]);
	const formData = ref<KeyStringObject>({});
	const formIns = ref<FormInstance>(EmptyObject);
	const editItemInses = ref<Array<InstanceType<typeof EditItem>>>([]);

	const mode = computed(() => props.mode ?? props.modalDialogProps?.mode);

	provide("mode", mode);

	onBeforeMount(() => {
		if (!props.modalDialogProps) {
			return;
		}

		props.modalDialogProps.askIfNeedToLeave = askIfNeedToLeave;
	});
	onMounted(async () => {
		await nextTick();
		await updateFormData();

		props.onPrepared?.(formData.value, props.fields, mode.value);
		window.templateFormData = formData;
		if (mode.value !== "details") {
			rules.value = Object.values(props.fields).reduce((prev, field, idx) => {
				const fieldName = field.field_name;
				const config = field.config;
				if (
					field &&
					// 添加模式，可编辑 或 不可编辑但配置指定可编辑
					((mode.value === "add" && (field.editable || field.editable_when_add)) ||
						// 编辑模式时，字段可编辑
						field.editable)
				) {
					if (config.rule) {
						prev[fieldName] = config.rule;
					}
				}
				return prev;
			}, {} as FormRules);
		}
		layoutFields();
		await nextTick();
		props.onRendered?.(formData.value);
	});

	defineExpose({ updateFormData, formData, initFormData, submit: onSubmit, formIns, askIfNeedToLeave, getItemInstance });
	watch(() => props.rawData, updateFormData.bind(null, undefined));
	watch(() => props.fields, layoutFields);

	async function askIfNeedToLeave() {
		if (mode.value === "details") {
			return true;
		}

		const func = () => {
			const diff = ObjectUtils.getChangedAttributes(initFormData, formData.value);
			return !diff;
		};

		const res =
			(await props.onBeforeLeave?.(
				{
					raw: props.rawData,
					init: initFormData,
					current: formData.value,
				},
				func,
			)) ?? func();

		if (res === true) {
			return true;
		}

		return new Promise<Function | boolean>((resolve, reject) => {
			confirm("确定要离开吗? 当前所作更改将不会保存!", {
				callback: (action, _ins) => {
					if (action === "cancel") {
						resolve(false);
						return;
					}

					resolve(true);

					if (res instanceof Function) {
						res();
					}
				},
			});
		});
	}

	function layoutFields() {
		if (!Object.keys(props.fields).length) {
			return;
		}

		let totalSpan = 0;
		let layout: string[] = [];
		layouts.value = new Array(layout);

		Object.values(props.fields)
			.filter((item) => item.config.layoutSpan)
			.sort((l, r) => l.config.index - r.config.index)
			.forEach((field) => {
				const config = field.config;

				// 字段不存在时，跳过该字段
				if (!field) {
					return;
				}

				// 字段配置自定义显示时
				if (config.show) {
					// 根据当前模式决定是否布局该字段
					if (config.show !== true && !config.show(mode.value ?? "details", field, props)) {
						return;
					}
				} else if (mode.value === "add" && !field.editable && !field.editable_when_add) {
					return;
				}

				if (field.display_name.length > labelWidth.value) {
					labelWidth.value = field.display_name.length;
				}

				if (totalSpan + config.layoutSpan > 24) {
					totalSpan = config.layoutSpan;
					layout = [field.field_name];
					layouts.value.push(layout);
				} else {
					totalSpan += config.layoutSpan;
					layout.push(field.field_name);
				}
			});

		if (props.modalDialogProps && !props.modalDialogProps.width) {
			const isSingleColumn = (layouts.value.length === 1 && layouts.value[0].length === 0) || layouts.value.every((item) => item.length === 1);
			props.modalDialogProps!.width = isSingleColumn ? 550 : 700;
		}

		if (rules.value && Object.keys(rules.value).length) {
			labelWidth.value += 2;
		} else {
			labelWidth.value += 1;
		}
	}

	function cloneFormData(data: KeyStringObject, ...ignoreFields: Array<string>) {
		const blobFields = [];
		for (const fieldName of Object.keys(data)) {
			if (ignoreFields.includes(fieldName)) {
				continue;
			}

			const field = props.fields[fieldName];
			if (field && (field.config.type === "file" || field.config.type === "image")) {
				blobFields.push(fieldName);
				ignoreFields.push(fieldName);
			}
		}

		const res = ObjectUtils.clone(data, ...ignoreFields);
		for (const fieldName of blobFields) {
			if (data[fieldName]) {
				(res as any)[fieldName] = data[fieldName];
			}
		}
		return res;
	}

	async function updateFormData(attrs?: KeyStringObject) {
		if (attrs) {
			Object.assign(formData.value, attrs);
		} else {
			const func = function (rawData: Optional<KeyStringObject>, ...ignoreFields: Array<string>) {
				if (!rawData || Array.isArray(rawData)) {
					return {};
				}

				return cloneFormData(rawData, ...ignoreFields);
			};

			const data = toRaw(props.rawData);
			formData.value = (await props.onUpdatingFormData?.(data, func, props.modalDialogProps)) ?? func(data);
			Object.assign(initFormData, cloneFormData(formData.value));
		}
	}

	async function onSubmit(buttonFlags?: any) {
		if (mode.value === "details") {
			return;
		}

		let action = props.modalDialogProps?.action ?? props.action;
		if (!action) {
			info("msg", { message: "不支持提交操作！" });
			return;
		}

		let valid = false;
		try {
			valid = await formIns.value!.validate();
		} catch (error) {}

		if (!valid) {
			return;
		}

		const reqMethod = (props.operAction ?? props.mode) == "add" ? "POST" : "PUT";

		let postData: Ref<KeyStringObject>;
		if ("PUT" == reqMethod) {
			postData = ref(ObjectUtils.getChangedAttributes(initFormData, formData.value) ?? {});
		} else {
			const temp = toRaw(formData.value);
			postData = ref(Object.assign({}, temp));
		}

		if (props.onCollectingPostData) {
			const temp = props.onCollectingPostData(
				{
					raw: props.rawData,
					init: initFormData,
					current: formData.value,
				},
				postData,
				mode.value,
				buttonFlags,
			);

			if (temp === CollectEnd) {
				return;
			} else if (temp?.startsWith("/")) {
				action = temp;
			} else if (temp) {
				action = action + "?" + temp;
			}
		}

		if (Object.keys(postData.value).length == 0) {
			info("msg", { message: "当前未作任何修改!" });
			return;
		}

		if (props.mode != "add" && !postData.value["ids"] && !postData.value["id"]) {
			if (Array.isArray(props.rawData)) {
				postData.value["ids"] = props.rawData.map((item) => item["id"]);
			} else {
				postData.value["id"] = props.rawData!["id"];
			}
		}

		return new Promise((resolve) => {
			confirm(`确定要${props.title}吗?`, {
				callback: async (dialogAction, _ins) => {
					if (dialogAction != "confirm") return;
					resolve(dialogAction);
					submit(toRaw(postData), action, reqMethod);
				},
			});
		});
	}

	async function submit(postData: KeyStringObject, action: string, reqMethod: string) {
		for (let idx = 0; idx < editItemInses.value.length; idx++) {
			const editItemIns = editItemInses.value[idx];

			if (!editItemIns.isFileUpload()) {
				continue;
			}

			const uploadContrlIns = editItemIns.controlIns as InstanceType<typeof KUpload>;
			if (false === uploadContrlIns.$props.autoUploadWhenSubmit) {
				continue;
			}

			const res = await uploadContrlIns.upload({
				alwaysShowFeedbackMsg: false,
				loading: props.modalDialogProps?.loading,
			});

			if (!res.success) {
				error("msg", { message: `上传 ${editItemIns.field.display_name} 失败，原因：${res.msg}` });
				return;
			}

			if (res.data) {
				postData.value[editItemIns.field.field_name] = res.data;
			}
		}

		let handledRes: Awaited<ReturnType<NonNullable<typeof props.onBeforeSubmit>>> | undefined;
		if (props.onBeforeSubmit && !(handledRes = await props.onBeforeSubmit(postData.value))) {
			props.modalDialogProps && (props.modalDialogProps.loading.value = false);
			return;
		}

		const result =
			typeof handledRes === "object"
				? handledRes
				: await axiosRequest({
						url: action,
						method: reqMethod,
						data: toRaw(postData.value),
						extraOptions: {
							loading: props.modalDialogProps?.loading,
							alwaysShowFeedbackMsg: false,
						},
					});

		const feedbackType = props.onSubmit ? props.onSubmit(result, defaultSubmitCallback) : defaultSubmitCallback(result);
		if (!feedbackType) {
			return;
		}

		if (result.success) {
			success(feedbackType);
			onUpdatedData(postData, result);
		} else {
			error(feedbackType, { message: `操作失败! ${result.msg ?? ""}` });
		}
	}

	function defaultSubmitCallback(result: Result): Parameters<typeof error>[0] {
		if (result.isFieldValidationError()) {
			const fieldName = result.getErrorField();
			if (fieldName) {
				const field = props.fields[fieldName];
				if (field) {
					result.msg = result.msg!.replace(fieldName, field.display_name);
				}
			}
		}
		return "msg";
	}

	function onUpdatedData(postData: KeyStringObject, result: Result) {
		props.modalDialogProps && (props.modalDialogProps.show = false);

		let func: Optional<DataChangedCallback>;
		if (Array.isArray(props.onUpdatedData)) {
			func = props.onUpdatedData[props.onUpdatedData.length - 1];
		} else {
			func = props.onUpdatedData;
		}
		func?.(props.operAction ?? props.mode, result.data ?? postData.value);
	}

	function updateEditItemReferences(instance: any) {
		if (!editItemInses.value.includes(instance)) {
			editItemInses.value.push(instance);
		}
	}

	function customFieldRegister(field: IField) {
		if (field.config.rule) {
			rules.value![field.field_name] = field.config.rule;
		}

		return field;
	}

	function getItemInstance(fieldName: string) {
		return editItemInses.value.find((item) => item.field.field_name === fieldName);
	}
</script>

<template>
	<ElForm
		ref="formIns"
		status-icon
		class="edit-template"
		:class="mode"
		:rules="rules"
		:model="formData"
		:label-width="`${labelWidth + 0.5}em`"
		v-bind="$attrs"
	>
		<template v-if="layouts.length">
			<slot
				name="front"
				:fields="fields"
				:formData="formData"
				:references="updateEditItemReferences"
			>
			</slot>
			<slot
				name="layouts"
				:fields="fields"
				:formData="formData"
				:references="updateEditItemReferences"
			>
				<template v-for="names in layouts">
					<ElRow :gutter="names.length == 1 ? void 0 : 10">
						<ElCol
							v-for="name in names"
							:span="names.length == 1 ? void 0 : fields[name].config.layoutSpan"
						>
							<EditItem
								ref="editItemInses"
								v-model="formData[name]"
								:field="fields[name]"
							>
								<template
									v-if="$slots[name]"
									#default="scope"
								>
									<slot
										:name="name"
										v-bind="{ formData, ...scope, value: formData[name], customFieldRegister }"
									></slot>
								</template>
								<template
									#display="scope"
									v-if="$slots[`${name}-display`]"
								>
									<slot
										:name="`${name}-display`"
										v-bind="{ formData, ...scope, value: formData[name] }"
									></slot>
								</template>
								<template
									v-if="$slots[`${name}-input`]"
									#input="scope"
								>
									<slot
										:name="`${name}-input`"
										v-bind="{ formData, ...scope, customFieldRegister }"
									></slot>
								</template>
							</EditItem>
						</ElCol>
					</ElRow>
				</template>
			</slot>
			<slot
				name="end"
				:fields="fields"
				:formData="formData"
				:references="updateEditItemReferences"
			>
			</slot>
			<div
				class="tips"
				v-if="mode !== 'details' && $slots['tips']"
			>
				<p class="title">注意事项:</p>
				<slot name="tips"> </slot>
			</div>
			<ElFormItem
				v-if="mode != 'details'"
				class="edit-item operations"
			>
				<slot
					v-if="$slots['operations']"
					name="operations"
					:onSubmit="onSubmit"
				></slot>
				<ElButton
					v-else
					type="primary"
					@click="onSubmit"
					>立即{{ props.title }}
				</ElButton>
			</ElFormItem>
		</template>
		<div
			v-else
			class="empty-layouts"
		>
			{{ Object.keys(formData)?.length ? "未配置任何可编辑或展示的字段" : "" }}
		</div>
	</ElForm>
</template>

<style>
	.vjs-tree-node.is-highlight,
	.vjs-tree-node:hover {
		background-color: var(--hover-background-color);
	}
</style>

<style scoped lang="css">
	.edit-template {
		padding-left: 0.5em;
		padding-right: 1em;
	}
	.edit-template.details {
		padding: 0.5em;
	}
	.edit-template .empty-layouts {
		height: 30em;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.edit-template :deep(.el-row) {
		margin-bottom: 1.2em;
	}
	.edit-template :deep(.el-row .edit-item),
	.edit-template.details :deep(.el-row) {
		margin-bottom: 0;
	}

	.tips {
		margin: 10px 0;
		line-height: 1.5em;
	}
	.tips :deep(p:not(.title)) {
		margin-left: 1em;
	}

	.edit-template:not(.el-form--label-top) :deep(.el-form-item__label) {
		padding: 0.5em 0;
		padding-right: 0.5em;
	}

	:global(.index-template .edit-item.operations) {
		margin-bottom: 0em;
	}
	.operations {
		margin-top: 1em;
	}
	.operations :deep(.el-form-item__content) {
		margin-left: 0 !important;
		justify-content: center;
	}
	.edit-template :deep(.edit-item.operations .el-button) {
		width: max-content;
	}
</style>
