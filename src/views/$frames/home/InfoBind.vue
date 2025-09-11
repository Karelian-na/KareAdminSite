<!-- @format -->

<script setup lang="ts">
	import type { IDialogProps } from "@/common";
	import type { Result } from "@/common/utils/Result";
	import type { KeyStringObject } from "@/common/utils";
	import type { FormInstance, FormRules } from "element-plus";

	import Verify from "@/components/Verify.vue";
	import IconFont from "@/components/IconFont.vue";
	import { ElForm, ElFormItem, ElButton, ElSteps, ElStep, ElContainer, ElMain, ElHeader } from "element-plus";

	import { reactive, ref } from "vue";
	import { axiosRequest } from "@/common/utils/Network";
	import { securityOptions, emailRule, phoneRule } from ".";
	import { EmptyObject, requiredRule } from "@/common/utils";
	import { confirm, error } from "@/common/utils/Interactive";

	const props = defineProps<{
		type: string;
		modalDialogProps: IDialogProps;

		secretSerial?: string;
	}>();

	const emits = defineEmits<{
		(e: "update:secretSerial", value?: string): void;
	}>();

	const formData = reactive({
		old: "",
		new: "",
		code: "",
		traceId: "",
	});
	const loading = ref(false);
	const step = ref(props.secretSerial ? 0 : 1);
	const formIns = ref<FormInstance>(EmptyObject);

	const rules: FormRules = {
		old: props.type === "bind_email" ? emailRule : phoneRule,
		new: props.type === "bind_email" ? emailRule : phoneRule,
		code: [
			requiredRule,
			{ pattern: /^[0-9]{6,6}$/g, message: "验证码必须为6位数字!" },
			{
				async asyncValidator(rule, value, callback, source, options) {
					if (!loading.value) {
						callback();
						return;
					}

					let url, serial;
					if (step.value === 0) {
						url = "/self/binded/verify";
						serial = formData.old;
					} else if (step.value === 1) {
						url = "/self/bind";
						serial = formData.new;
					} else {
						callback();
						return;
					}

					const result = await axiosRequest({
						method: "PUT",
						url: url,
						data: {
							traceId: formData.traceId,
							code: formData.code,
							serial: serial,
							type: securityOptions[props.type].type,
						},
						extraOptions: {
							alwaysShowFeedbackMsg: false,
						},
					});

					if (result.success) {
						if (step.value === 1) {
							emits("update:secretSerial", formData.new.replace(formData.new.substring(3, 7), "****"));
						}
						callback();
					} else {
						callback(result.msg);
					}
					return;
				},
			},
		],
	};

	function onNextStep() {
		if (step.value == 2) {
			props.modalDialogProps!.show = false;
			return;
		}
		loading.value = true;
		formIns.value.validate((isValid, error) => {
			loading.value = false;
			if (!isValid) {
				return;
			}
			formData.code = "";
			++step.value;
		});
	}

	function onRebindSend(data: KeyStringObject) {
		loading.value = true;

		if (formData.traceId) {
			data["verification"] = {
				traceId: formData.traceId,
				type: securityOptions[props.type].type,
				serial: formData.old,
			};
		}
	}

	function onUnbindSerial() {
		confirm(`确定要取消绑定${securityOptions[props.type].title} '${props.secretSerial}' 吗?`, {
			callback: async (action, _ins) => {
				if (action != "confirm") return;

				const result = await axiosRequest({
					method: "PUT",
					url: "/self/bind",
					data: {
						traceId: formData.traceId,
						code: formData.code,
						serial: formData.old,
						action: 1,
						type: securityOptions[props.type].type,
					},
					extraOptions: {
						alwaysShowFeedbackMsg: false,
					},
				});
				if (result.success) {
					emits("update:secretSerial", undefined);
					++step.value;
				} else {
					error("msg", { message: result.msg });
				}
			},
		});
	}

	function onVerifyCodeSent(result: Result) {
		loading.value = false;
		if (result.success) {
			formData.traceId = result.data;
		}
	}
</script>

<template>
	<ElContainer class="top position-center">
		<ElHeader>
			<ElSteps
				simple
				:space="200"
				:active="step"
			>
				<ElStep :title="`验证${securityOptions[props.type].title}`">
					<template #icon>
						<IconFont value="verify" />
					</template>
				</ElStep>
				<ElStep :title="`绑定新${securityOptions[props.type].title}`">
					<template #icon>
						<IconFont :value="securityOptions[props.type].icon" />
					</template>
				</ElStep>
				<ElStep :title="`${secretSerial ? '绑定' : '修改'}成功`">
					<template #icon>
						<IconFont value="finish" />
					</template>
				</ElStep>
			</ElSteps>
		</ElHeader>
		<ElMain>
			<ElForm
				status-icon
				ref="formIns"
				label-position="top"
				:rules="rules"
				:model="formData"
			>
				<template v-if="step === 0">
					<Verify
						url="/self/binded/send"
						:form-data="formData"
						:prop="['old', 'code']"
						:option="securityOptions[type]"
						@sending="loading = true"
						@sent="onVerifyCodeSent"
					>
						<template #front>
							<p class="descrip">
								请填写完整的{{ securityOptions[type].title }}
								<span class="secret">{{ secretSerial }}</span>
								以证明您的身份
							</p>
						</template>
					</Verify>
				</template>
				<template v-else-if="step === 1">
					<Verify
						url="/self/bind/send"
						:form-data="formData"
						:prop="['new', 'code']"
						:option="securityOptions[type]"
						@sending="onRebindSend"
						@sent="onVerifyCodeSent"
					>
						<template
							v-if="props.secretSerial"
							#front
						>
							<p
								class="cancel"
								@click="onUnbindSerial"
							>
								我不想绑定新{{ securityOptions[type].title }}, 仅取消绑定旧{{ securityOptions[type].title }}
							</p>
						</template>
					</Verify>
				</template>
				<template v-else-if="step === 2">
					<p class="success">{{ secretSerial ? "绑定" : "修改" }}成功!</p>
				</template>
				<ElFormItem class="operations">
					<ElButton
						type="primary"
						@click="onNextStep"
						:loading="loading"
						>{{ step === 0 ? "下一步" : step === 1 ? "立即绑定" : "完成" }}
					</ElButton>
				</ElFormItem>
			</ElForm>
		</ElMain>
	</ElContainer>
</template>

<style scoped lang="css">
	.el-steps {
		width: 700px;
		line-height: 1;
		box-sizing: border-box;
	}

	.el-steps :deep(.iconfont) {
		font-size: 14px;
	}

	.el-form {
		position: relative;
		width: 60%;
		margin: auto;
	}

	.verify .cancel {
		margin-bottom: 1em;
		color: var(--el-color-primary);
		text-decoration: underline;
		text-align: right;
		cursor: pointer;
	}

	.el-form .success {
		margin-bottom: 2em;
		text-align: center;
		color: car(--el-color-primary);
	}

	.el-form-item.operations :deep(.el-form-item__content) > .el-button {
		width: 100%;
		height: 2.5em;
	}
</style>
