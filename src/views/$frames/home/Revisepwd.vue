<!-- @format -->

<script setup lang="ts">
	import type { Result } from "@/common/utils/Result";
	import type { KeyStringObject } from "@/common/utils";

	import Verify from "@/components/Verify.vue";
	import IconFont from "@/components/IconFont.vue";
	import {
		ElCard,
		ElForm,
		ElFormItem,
		ElSteps,
		ElStep,
		FormRules,
		ElInput,
		ElButton,
		ElContainer,
		ElAside,
		ElHeader,
		ElMain,
		FormInstance,
	} from "element-plus";

	import { sha256 } from "js-sha256";
	import { securityOptions } from ".";
	import { useRouter } from "vue-router";
	import { axiosRequest } from "@/common/utils/Network";
	import { EmptyObject, requiredRule } from "@/common/utils";
	import { error, success } from "@/common/utils/Interactive";
	import { Component, h, onMounted, reactive, ref } from "vue";

	const props = defineProps<{
		account?: string;
		mode: "retrieve" | "revise";
	}>();

	enum RevisepwdStep {
		INPUT_ACCOUNT,
		VERIFY_IDENTITY,
		REVISE_PWD,
		SUCCESS,
	}

	const step = ref(RevisepwdStep.INPUT_ACCOUNT);
	const serial = ref("");
	const loading = ref(false);
	const formData = reactive({
		account: props.account,

		serial: "",
		code: "",
		traceId: "",

		old: "",
		pwd: "",
		confirm: "",
	});
	const verifyMethod = ref("");
	const formIns = ref<FormInstance>(EmptyObject);
	const verifyMethodsInfo = ref<Record<string, string>>({});

	const router = useRouter();
	const rules: FormRules = {
		account: [
			props.mode === "retrieve" ? requiredRule : {},
			{
				async asyncValidator(rule, value, callback, source, options) {
					if (!loading.value) {
						callback();
						return;
					}

					const result = await axiosRequest({
						method: "GET",
						url: "/users/verifies",
						params: {
							account: value,
						},
						extraOptions: {
							alwaysShowFeedbackMsg: false,
						},
					});

					if (result.success) {
						if (Object.keys(result.data).length === 0) {
							if (props.mode === "revise") {
								callback();
							} else {
								callback("账号未包含安全验证! 请登录后更改密码或联系管理员!");
							}
							return;
						}
						verifyMethodsInfo.value = result.data;
						callback();
					} else {
						callback(result.msg);
					}
					return;
				},
				trigger: "blur",
			},
		],
		serial: [
			requiredRule,
			{
				validator(rule, value: string, callback, source, options) {
					switch (verifyMethod.value) {
						case "bind_email":
							if (!value.match(/^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/)) {
								callback("邮箱格式错误!");
								return;
							}
							break;
						case "bind_phone":
							if (!value.match(/^(13[0-9]|14[5|7]|15[0|1|2|3|5|6|7|8|9]|18[0|1|2|3|5|6|7|8|9])\d{8}$/)) {
								callback("手机号格式错误!");
								return;
							}
							break;
						default:
							callback("验证方式有误!");
							return;
					}

					callback();
				},
				trigger: "blur",
			},
		],
		code: [
			requiredRule,
			{ min: 4, max: 6, message: "请输入正确格式的验证码" },
			{
				async asyncValidator(rule, value, callback, source, options) {
					if (!loading.value) {
						callback();
						return;
					}

					if (!formData.traceId) {
						callback("请先获取验证码!");
						return;
					}

					const data = {
						traceId: formData.traceId,
						type: securityOptions[verifyMethod.value].type,
						serial: formData.serial,
						code: formData.code,
					} as KeyStringObject;

					if (props.mode === "retrieve") {
						data["account"] = props.account;
					}

					const result = await axiosRequest({
						method: "PUT",
						url: "/self/revisepwd/verify",
						data: data,
						extraOptions: {
							alwaysShowFeedbackMsg: false,
						},
					});

					if (result.success) {
						callback();
					} else {
						callback(result.msg);
					}
					return;
				},
			},
		],
		old: requiredRule,
		pwd: [requiredRule, { min: 6, max: 16, message: "密码必须介于6~16个字符之间", trigger: "blur" }],
		confirm: [
			requiredRule,
			{
				validator(rule, value, callback, source, options) {
					if (value !== formData.pwd) {
						callback("密码输入不一致!");
						return;
					}

					if (value === formData.old) {
						callback("新旧不能密码一致!");
						return;
					}

					callback();
				},
			},
		],
	};

	onMounted(() => {
		if (props.mode === "revise") {
			onNextStep();
		}
	});

	function onSelectVerifyMethod(method: string) {
		verifyMethod.value = method;
		serial.value = verifyMethodsInfo.value[method];
		formData.serial = "";
	}

	async function onNextStep() {
		if (step.value == RevisepwdStep.SUCCESS) {
			router.push({ name: "login" });
			return;
		}
		loading.value = true;

		let res = false;
		try {
			res = await formIns.value.validate();
		} catch (e) {}

		// validate failed
		if (!res) {
			loading.value = false;
			return;
		}

		// if logined in and user hasn't any verify methods, using old password to verify
		if (
			step.value === RevisepwdStep.INPUT_ACCOUNT && //
			props.mode === "revise" && //
			!Object.keys(verifyMethodsInfo.value).length
		) {
			loading.value = false;
			step.value = RevisepwdStep.REVISE_PWD;
			return;
		}

		// post the revise api
		if (step.value === RevisepwdStep.REVISE_PWD) {
			const data = {
				pwd: sha256(formData.pwd),
			} as KeyStringObject;

			if (formData.traceId) {
				data["verification"] = {
					traceId: formData.traceId,
					serial: formData.serial,
					type: securityOptions[verifyMethod.value].type,
				};
			}

			if (props.mode === "retrieve") {
				data["account"] = props.account;
			} else if (!formData.traceId) {
				data["old"] = sha256(formData.old);
			}

			const result = await axiosRequest({
				method: "PUT",
				url: "/self/revisepwd",
				data: data,
				extraOptions: {
					alwaysShowFeedbackMsg: false,
				},
			});

			if (result.success) {
				await new Promise((resolve, reject) => {
					setTimeout(() => resolve(0), 1000);
				});
				success("msg", { content: "修改成功！" });
				++step.value;
			} else {
				error("alert", { content: "修改失败！" + result.msg });
			}
			loading.value = false;
			return;
		}

		loading.value = false;
		++step.value;
	}

	function onSendingVerifyCode(data: KeyStringObject) {
		loading.value = true;
		if (props.mode === "retrieve") {
			data["account"] = props.account!;
		}
	}

	function onVerifyCodeSent(result: Result) {
		loading.value = false;
		if (result.success) {
			formData.traceId = result.data;
		}
	}

	// define a inner temp component to render operations
	const Operation: Component = {
		props: {
			label: {
				type: String,
				required: true,
			},
		},
		render() {
			return h(ElFormItem, { class: "operations" }, () => [
				h(
					ElButton,
					{
						type: "primary",
						loading: loading.value,
						onClick: onNextStep,
					},
					() => this.$props.label
				),
			]);
		},
	};
</script>

<template>
	<ElContainer class="top position-center">
		<ElHeader>
			<ElSteps
				simple
				:space="200"
				:active="step"
			>
				<ElStep title="输入账号">
					<template #icon>
						<IconFont value="edit" />
					</template>
				</ElStep>
				<ElStep title="验证身份">
					<template #icon>
						<IconFont value="verify" />
					</template>
				</ElStep>
				<ElStep title="密码修改">
					<template #icon>
						<IconFont value="edit" />
					</template>
				</ElStep>
				<ElStep title="修改成功">
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
				:class="mode"
				:rules="rules"
				:model="formData"
			>
				<template v-if="step === 0">
					<ElFormItem
						prop="account"
						label="输入找回密码的账号:"
					>
						<ElInput v-model="formData.account" />
					</ElFormItem>
					<Operation label="下一步" />
				</template>
				<template v-if="step === 1">
					<div class="switch-container">
						<Transition name="slide-fade">
							<div
								v-if="!verifyMethod"
								class="method-container"
							>
								<ElCard
									class="method"
									v-for="(value, key) in verifyMethodsInfo"
									@click="onSelectVerifyMethod(key)"
								>
									<ElContainer>
										<ElAside>
											<IconFont :value="securityOptions[key].icon" />
										</ElAside>
										<ElMain>
											<p class="title">{{ securityOptions[key].title }}验证</p>
											<p class="descrip">通过发送验证码至{{ value }}进行验证</p>
										</ElMain>
									</ElContainer>
								</ElCard>
							</div>
							<div v-else>
								<Verify
									url="/self/revisepwd/send"
									:formData="formData"
									:secret-serial="serial"
									:prop="['serial', 'code']"
									:option="securityOptions[verifyMethod]"
									@sending="onSendingVerifyCode"
									@sent="onVerifyCodeSent"
								>
									<template #front>
										<p
											class="switch-method"
											@click="verifyMethod = ''"
										>
											切换验证方式
										</p>
									</template>
								</Verify>
								<Operation label="下一步" />
							</div>
						</Transition>
					</div>
				</template>
				<template v-else-if="step === 2">
					<ElFormItem
						v-if="mode === 'revise' && Object.keys(verifyMethodsInfo).length == 0"
						prop="old"
						label="输入旧密码:"
					>
						<ElInput
							show-password
							type="password"
							v-model="formData.old"
						/>
					</ElFormItem>
					<ElFormItem
						prop="pwd"
						label="输入新密码:"
					>
						<ElInput
							show-password
							type="password"
							v-model="formData.pwd"
						/>
					</ElFormItem>
					<ElFormItem
						prop="confirm"
						label="确认新密码:"
					>
						<ElInput
							type="password"
							v-model="formData.confirm"
						/>
					</ElFormItem>
					<Operation label="下一步" />
				</template>
				<Operation
					v-else-if="step === 3"
					label="去登陆"
				/>
			</ElForm>
		</ElMain>
	</ElContainer>
</template>

<style scoped lang="css">
	.el-container.top {
		width: 800px;
		position: relative;
		top: 25%;
	}

	.el-steps {
		line-height: 1;
	}

	.el-form {
		position: relative;
		width: 60%;
		margin: auto;
	}
	.el-form-item {
		margin-bottom: 1.5em;
	}

	.el-card.method {
		cursor: pointer;
		margin-bottom: 1em;
	}
	.el-card.method .el-aside {
		padding: 1.2em;
		display: flex;
		align-items: center;
		width: max-content;
		padding-right: 0;
	}
	.el-card.method .el-aside :deep(.iconfont) {
		font-size: 4.5em;
	}
	.el-card.method .el-main .title {
		font-size: 1.5em;
		margin-bottom: 0.5em;
	}
	.el-card.method .el-main .descrip {
		word-break: break-all;
		line-height: 1.2;
	}

	.el-input :deep(input) {
		height: 2em;
	}

	.switch-container {
		width: 100%;
		display: grid;
	}
	.switch-container > * {
		grid-area: 1 / 1;
	}

	.verify .switch-method {
		cursor: pointer;
		margin-bottom: 10px;
		text-decoration: underline;
		color: var(--el-color-primary);
	}
	.el-form-item.operations :deep(.el-form-item__content) .el-button {
		width: 100%;
		height: 2.5em;
	}

	.slide-fade-enter-active {
		transition: all var(--transition-duration) ease-out;
	}
	.slide-fade-leave-active {
		transition: all var(--transition-duration) ease-in-out;
	}
	.slide-fade-enter-from,
	.slide-fade-leave-to {
		transform: translateX(2em);
		opacity: 0;
	}
</style>
