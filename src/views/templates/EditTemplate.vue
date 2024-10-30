<!-- @format -->

<script setup lang="ts">
	import type { Ref } from "vue";
	import type { DataChangedCallback, EditTemplateProps } from ".";
	import type { FormInstance, FormRules } from "element-plus";
	import type { KeyStringObject, Optional } from "@/common/utils";

	import EditItem from "./EditItem.vue";
	import { ElForm, ElButton, ElRow, ElCol, ElFormItem } from "element-plus";

	import { CollectEnd } from ".";
	import { EmptyObject } from "@/common/utils";
	import { ObjectUtils } from "@/common/utils/Object";
	import { adminRequest } from "@/common/utils/Network";
	import { confirm, error, info, success } from "@/common/utils/Interactive";
	import { onBeforeMount, onMounted, provide, ref, toRaw, watch, nextTick, computed } from "vue";

	const props = defineProps<EditTemplateProps>();

	const rules = ref<FormRules>();
	const initFormData: KeyStringObject = {};

	const labelWidth = ref(4);
	const layouts = ref<Array<string[]>>([]);
	const formData = ref<KeyStringObject>({});
	const formIns = ref<FormInstance>(EmptyObject);
	const editItemInses = ref<Array<InstanceType<typeof EditItem>>>([]);

	const mode = computed(() => props.modalDialogProps?.mode ?? props.mode);

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
		if (mode.value !== "details") {
			rules.value = Object.values(props.fields).reduce((prev, field, idx) => {
				const fieldName = field.field_name;
				const config = field.config;
				if (
					field &&
					// 编辑模式时，字段可编辑
					((mode.value === "edit" && field.editable) ||
						// 添加模式，可编辑 或 不可编辑但配置指定可编辑
						(mode.value === "add" && (field.editable || field.editable_when_add)))
				) {
					if (config.rule) {
						prev[fieldName] = config.rule;
					}
				}
				return prev;
			}, {} as FormRules);
		}
		layoutFields();
		window.templateFormData = formData;
		await nextTick();
		props.onRendered?.(formData.value);
	});

	defineExpose({ updateFormData, formData, submit: onSubmit, formIns, askIfNeedToLeave });
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
			props.onBeforeLeave?.(
				{
					raw: props.rawData,
					init: initFormData,
					current: formData.value,
				},
				func
			) ?? func();

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
					if (config.show !== true && !config.show(mode.value ?? "details")) {
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
			const isSingleColumn = layouts.value.every((item) => item.length === 1);
			props.modalDialogProps!.width = isSingleColumn ? 550 : 700;
		}
	}

	async function updateFormData(attrs?: KeyStringObject) {
		if (attrs) {
			Object.assign(formData.value, attrs);
		} else {
			const func = function (rawData: Optional<KeyStringObject>, ...ignoreFields: Array<string>) {
				if (!rawData) {
					return {};
				}

				const res = ObjectUtils.clone(rawData, ...ignoreFields);
				return res;
			};

			const data = toRaw(props.rawData);
			formData.value = (await props.onUpdatingFormData?.(data, func, props.modalDialogProps)) ?? func(data);
			Object.assign(initFormData, ObjectUtils.clone(toRaw(formData.value)));
		}
	}

	function onSubmit() {
		if (mode.value === "details") {
			return;
		}

		let action = props.modalDialogProps?.action ?? props.action;
		if (!action) {
			info("msg", { message: "不支持提交操作！" });
			return;
		}

		formIns.value!.validate(async (state, fields) => {
			if (!state) return;

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
					mode.value
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
				postData.value["id"] = props.rawData!["id"];
			}

			confirm(`确定要${props.title}吗?`, {
				callback: async (dialogAction, _ins) => {
					if (dialogAction != "confirm") return;

					for (let idx = 0; idx < editItemInses.value.length; idx++) {
						const ins = editItemInses.value[idx];
						if (!ins.uploadIns) {
							continue;
						}

						const res = await ins.uploadIns.upload({
							alwaysShowFeedbackMsg: false,
							loading: props.modalDialogProps?.loading,
						});
						if (res === true) {
							continue;
						}

						if (!res) {
							error("msg", { message: `上传 ${ins.field.display_name} 失败！` });
							return;
						}
						postData.value[ins.field.field_name] = res;
					}

					if (props.onBeforeSubmit && !(await props.onBeforeSubmit(postData.value))) {
						props.modalDialogProps && (props.modalDialogProps.loading.value = false);
						info("msg", { message: "操作在提交前被中断！" });
						return;
					}

					adminRequest({
						url: action,
						method: reqMethod,
						data: toRaw(postData.value),
						extraOptions: {
							loading: props.modalDialogProps?.loading,
						},
						callback: (result) => {
							if (!result.success) {
								// 字段校验错误，对应服务端错误代码
								if (result.code & 0x6000000) {
									const commaIdx = result.msg?.indexOf(":");
									if (!commaIdx || commaIdx === -1) {
										return;
									}
									const fieldName = result.msg!.substring(commaIdx + 1).trim();
									const field = props.fields[fieldName];
									if (field) {
										result.msg = result.msg!.replace(fieldName, field.display_name);
									}
								}
								return false;
							}

							success("alert", {
								callback: () => {
									props.modalDialogProps && (props.modalDialogProps.show = false);

									let func: Optional<DataChangedCallback>;
									if (Array.isArray(props.onUpdatedData)) {
										func = props.onUpdatedData[props.onUpdatedData.length - 1];
									} else {
										func = props.onUpdatedData;
									}
									func?.(props.operAction ?? props.mode, result.data ?? postData.value);
								},
							});
							return true;
						},
					});
				},
			});
		});
	}

	function updateEditItemReferences(instance: any) {
		if (!editItemInses.value.includes(instance)) {
			editItemInses.value.push(instance);
		}
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
		:label-width="`${labelWidth + 2}em`"
	>
		<template v-if="layouts.length">
			<slot
				name="layouts"
				:fields="fields"
				:formData="formData"
				:references="updateEditItemReferences"
			>
				<template v-for="names in layouts">
					<template v-if="names.length == 1">
						<EditItem
							ref="editItemInses"
							v-model="formData[names[0]]"
							:field="fields[names[0]]"
						>
							<template
								v-if="$slots[names[0]]"
								#default="scope"
							>
								<slot
									:name="names[0]"
									v-bind="{ formData, ...scope, value: formData[names[0]] }"
								></slot>
							</template>
							<template
								#display="scope"
								v-if="$slots[`${names[0]}-display`]"
							>
								<slot
									:name="`${names[0]}-display`"
									v-bind="{ formData, ...scope, value: formData[names[0]] }"
								></slot>
							</template>
							<template
								v-if="$slots[`${names[0]}-input`]"
								#input="scope"
							>
								<slot
									:name="`${names[0]}-input`"
									v-bind="{ formData, ...scope }"
								></slot>
							</template>
						</EditItem>
					</template>
					<ElRow
						v-else
						:gutter="40"
					>
						<ElCol
							v-for="name in names"
							:span="fields[name].config.layoutSpan"
						>
							<EditItem
								ref="editItemInses"
								v-model="formData[name]"
								:field="fields[name]"
							>
								<template
									v-if="$slots[names[0]]"
									#default="scope"
								>
									<slot
										:name="names[0]"
										v-bind="{ formData, ...scope, value: formData[names[0]] }"
									></slot>
								</template>
								<template
									#display="scope"
									v-if="$slots[`${name}-display`]"
								>
									<slot
										:name="`${name}-display`"
										v-bind="{ formData, ...scope, value: formData[names[0]] }"
									></slot>
								</template>
								<template
									v-if="$slots[`${name}-input`]"
									#input="scope"
								>
									<slot
										:name="`${name}-input`"
										v-bind="{ formData, ...scope }"
									></slot>
								</template>
							</EditItem>
						</ElCol>
					</ElRow>
				</template>
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

<style scoped lang="css">
	.edit-template {
		padding-left: 0.5em;
		padding-right: 1em;
	}
	.edit-template.details {
		padding: 0.5em;
	}
	.edit-template .empty-layouts {
		height: 500px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.edit-template :deep(.el-row),
	.edit-template .edit-item {
		margin-bottom: 1.2em;
	}
	.edit-template > :deep(.el-row > .el-col) {
		min-width: min-content;
	}
	.edit-template :deep(.el-row .edit-item),
	.edit-template.details :deep(.el-row),
	.edit-template.details :deep(.edit-item) {
		margin-bottom: 0;
	}

	.tips {
		margin: 10px 0;
		line-height: 1.5em;
	}
	.tips :deep(p:not(.title)) {
		margin-left: 1em;
	}

	:global(.index-template .edit-item.operations) {
		margin-bottom: 0em;
	}
	.operations :deep(.el-form-item__content) {
		margin-left: 0 !important;
		justify-content: center;
	}
	.edit-template :deep(.operations .el-button) {
		width: max-content;
	}
</style>
