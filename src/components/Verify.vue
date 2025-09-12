<!-- @format -->

<script setup lang="ts">
	import type { KeyStringObject, SecurityOption, VerifyCodeSendingHandler, VerifyCodeSentCallback } from "@/common/utils";

	import { ref, watch } from "vue";
	import { EmptyObject } from "@/common/utils";
	import { axiosRequest } from "@/common/utils/Network";
	import { ElFormItem, ElInput, ElButton, FormItemInstance } from "element-plus";

	const props = defineProps<{
		url: string;
		method?: "POST";
		secretSerial?: string;
		option: SecurityOption;
		prop: [string, string];
		formData: KeyStringObject;
		onSent?: VerifyCodeSentCallback;
		onSending?: VerifyCodeSendingHandler;
	}>();

	const countDown = ref(61);
	const sending = ref(false);
	const formItemSerialIns = ref<FormItemInstance>(EmptyObject);

	watch(
		() => formItemSerialIns.value.validateState,
		(value) => {
			if (countDown.value > 1 && countDown.value <= 60) {
				return;
			}
			switch (value) {
				case "error":
					countDown.value = 61;
					break;
				case "success":
					countDown.value = 0;
					break;
				default:
					break;
			}
		}
	);

	async function onSendVerifyCode() {
		if (countDown.value !== 0) {
			return;
		}

		countDown.value = 61;
		const res = await formItemSerialIns.value.validate("blur");
		if (!res) {
			countDown.value = 0;
		}

		const data = {
			type: props.option.type,
			serial: props.formData[props.prop[0]],
		};
		props.onSending?.(data);

		sending.value = true;
		let result = await axiosRequest({
			method: props.method ?? "POST",
			url: props.url,
			data: data,
			extraOptions: {
				alwaysShowFeedbackMsg: false,
			},
		});
		if (result.success) {
			countDown.value = 60;
			const id = window.setInterval(() => {
				--countDown.value;
				if (countDown.value <= 0) {
					window.clearInterval(id);
				}
			}, 1000);
		} else {
			formItemSerialIns.value.validateState = "error";
			formItemSerialIns.value.validateMessage = result.msg!;
		}
		props.onSent?.(result);
		sending.value = false;
	}
</script>

<template>
	<div class="verify">
		<slot name="front"></slot>
		<p
			v-if="secretSerial"
			class="descrip"
		>
			请填写完整的{{ option.title }}
			<span class="secret">{{ secretSerial }}</span>
			以证明您的身份
		</p>
		<ElFormItem
			ref="formItemSerialIns"
			:prop="prop[0]"
			class="serial"
		>
			<ElInput
				v-model="formData[prop[0]]"
				:placeholder="`填写您的完整${option.title}`"
			>
			</ElInput>
		</ElFormItem>
		<ElFormItem
			:prop="prop[1]"
			class="code"
		>
			<ElInput
				v-model="formData[prop[1]]"
				placeholder="输入验证码"
			>
				<template #append>
					<ElButton
						:loading="sending"
						:disabled="countDown !== 0"
						@click="onSendVerifyCode"
						>{{ countDown > 0 && countDown <= 60 ? countDown + "s后重试" : "获取验证码" }}
					</ElButton>
				</template>
			</ElInput>
		</ElFormItem>
	</div>
</template>

<style scoped lang="css">
	.verify .el-form-item {
		margin-bottom: 2em;
	}

	.verify :deep(.el-input__inner) {
		height: 2.5em;
	}

	.verify :deep(.descrip) {
		line-height: 1.5;
		margin-bottom: 10px;
	}
	.verify :deep(.descrip .secret) {
		color: var(--primary-color);
	}

	.verify :deep(.el-input-group__prepend),
	.verify .code .el-button {
		height: 2.5em;
	}
</style>
