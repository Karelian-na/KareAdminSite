<!-- @format -->
<script setup lang="ts">
	import type { Ref } from "vue";
	import type { KeyStringObject } from "@/common/utils";
	import type { IDialogProps, IUserInfo } from "@/common";
	import type { ILoading } from "@/common/utils/Interactive";
	import type { BeforeSubmitHandler, DataChangedCallback } from "../templates";

	import InfoBind from "./InfoBind.vue";
	import RevisePwd from "./Revisepwd.vue";
	import IconFont from "@/components/IconFont.vue";
	import EditItem from "@/views/$frames/templates/EditItem.vue";
	import EditTemplate from "@/views/$frames/templates/EditTemplate.vue";
	import { ElSpace, ElCard, ElButton, ElContainer, ElAside, ElMain, ElCol, ElRow, ElDialog } from "element-plus";

	import { EmptyObject } from "@/common/utils";
	import { TemplateUtils } from "../templates";
	import { userFields, securityOptions } from ".";
	import { error } from "@/common/utils/Interactive";
	import { ObjectUtils } from "@/common/utils/Object";
	import { axiosRequest } from "@/common/utils/Network";
	import { inject, onBeforeMount, reactive, ref } from "vue";

	const userInfo = inject<Ref<IUserInfo>>("userInfo")!;
	const pageLoading = inject<ILoading>("pageLoading")!;

	const mode = ref("details");
	const ready = ref(false);
	const infoMode = ref("");
	const rawData = ref<KeyStringObject>();
	const securityDialogProps = reactive<IDialogProps>({
		show: false,
		mode: "",
	} as any);

	const editTemplateIns = ref<InstanceType<typeof EditTemplate>>(EmptyObject);

	onBeforeMount(async () => {
		const result = await axiosRequest({
			method: "GET",
			url: "/self/index",
			extraOptions: {
				loading: pageLoading,
				alwaysShowFeedbackMsg: false,
			},
		});

		if (!result.success) {
			error("msg", { message: "获取信息失败! 请尝试刷新页面!" });
			return;
		}

		rawData.value = result.data.data;

		const fieldsConfig = await TemplateUtils.resolveFieldConfigs(result.data.fieldsConfig);
		for (const fieldName in userFields) {
			userFields[fieldName].config = fieldsConfig[fieldName] ?? {};
		}

		userFields!["avatar"].config.itemBindProps = {
			label: "",
			labelWidth: "0",
		};

		["id", "uid", "name", "profile"].forEach((fieldName) => {
			ObjectUtils.mergeAttributes(userFields[fieldName].config, "itemBindProps", { labelWidth: "4.5em" });
		});
		ready.value = true;
	});

	const onUpdatedData: DataChangedCallback = function (action, data) {
		switch (action) {
			case "edit":
				mode.value = "details";
				(["name", "avatar"] as (keyof IUserInfo)[]).forEach((item) => {
					if (data[item]) {
						userInfo.value[item] = data[item];
					}
				});
				Object.assign(rawData.value!, data);
				editTemplateIns.value.updateFormData();
				return true;
			default:
				break;
		}
		return false;
	};

	const onBeforeSubmit: BeforeSubmitHandler = function (postData) {
		if (Array.isArray(postData["avatar"]) && postData["avatar"].length !== 0) {
			postData["avatar"] = postData["avatar"][0];
		}
		return true;
	};

	async function onMsgOperButtonClick() {
		if (mode.value === "details") {
			mode.value = "edit";
		} else {
			const showExit = await editTemplateIns.value.askIfNeedToLeave();
			if (showExit) {
				mode.value = "details";
				editTemplateIns.value.updateFormData();
			}
		}
	}

	function onSecurityButtonClick(mode: string) {
		infoMode.value = mode;
		securityDialogProps.show = true;
		switch (mode) {
			case "pwd":
				securityDialogProps.operLabel = "密码修改";
				break;
			default:
				securityDialogProps.operLabel = securityOptions[mode].title + "绑定";
				break;
		}
	}
</script>

<template>
	<EditTemplate
		v-if="rawData && ready"
		title="修改"
		class="personal"
		action="/self/edit"
		ref="editTemplateIns"
		:mode="mode"
		:fields="userFields"
		:raw-data="rawData"
		@updated-data="onUpdatedData"
		@before-submit="onBeforeSubmit"
	>
		<template #layouts="{ formData, references }">
			<ElSpace direction="vertical">
				<ElCard class="base">
					<EditItem
						:ref="references"
						v-model="formData['avatar']"
						:field="userFields['avatar']"
					/>
					<div class="info">
						<EditItem
							:ref="references"
							v-for="fieldName in ['id', 'uid', 'name', 'profile']"
							v-model="formData[fieldName]"
							:field="userFields[fieldName]"
						/>
					</div>
				</ElCard>
				<ElCard>
					<template #header>
						<span>基本信息</span>
						<span class="operation">
							<ElButton
								type="primary"
								v-if="mode === 'edit'"
								@click="editTemplateIns.submit"
								>立即修改
							</ElButton>
							<ElButton @click="onMsgOperButtonClick">{{ mode === "details" ? "编辑" : "退出" }}</ElButton>
						</span>
					</template>
					<EditItem
						:ref="references"
						v-for="fieldName in ['age', 'gender', 'clan', 'political_status', 'phone', 'email', 'roles', 'add_time']"
						v-model="formData[fieldName]"
						:field="userFields[fieldName]"
					/>
				</ElCard>
				<ElCard class="security">
					<template #header>账号安全</template>
					<ElContainer v-for="key in Object.keys(securityOptions).filter((item) => item !== 'pwd')">
						<ElAside>
							<IconFont :value="securityOptions[key].icon" />
						</ElAside>
						<ElMain>
							<ElRow>
								<ElCol
									:span="10"
									class="bind-tip"
								>
									<p class="name">{{ securityOptions[key].title }}绑定</p>
									<p class="">绑定{{ securityOptions[key].title }}后可使用{{ securityOptions[key].title }}登录</p>
									<p
										class="state"
										:class="formData[key] ? 'has-value' : ''"
									>
										{{ formData[key] ? "当前已绑定" : "暂未绑定" }}
									</p>
								</ElCol>
								<ElCol
									:span="10"
									class="bind-value"
								>
									{{ formData[key] }}
								</ElCol>
								<ElCol
									:span="4"
									class="bind-operation"
								>
									<ElButton @click="onSecurityButtonClick(key)">去{{ formData[key] ? "修改" : "绑定" }}</ElButton>
								</ElCol>
							</ElRow>
						</ElMain>
					</ElContainer>
					<ElContainer>
						<!-- 密码 -->
						<ElAside>
							<IconFont value="pwd" />
						</ElAside>
						<ElMain>
							<ElRow>
								<ElCol
									:span="8"
									class="bind-tip"
								>
									<p class="name">密码安全</p>
									<p>设置更复杂的密码可提高账号安全性</p>
								</ElCol>
								<ElCol :span="12" />
								<ElCol
									:span="4"
									class="bind-operation"
								>
									<ElButton @click="onSecurityButtonClick('pwd')">去修改</ElButton>
								</ElCol>
							</ElRow>
						</ElMain>
					</ElContainer>
					<ElDialog
						draggable
						destroy-on-close
						width="max-content"
						v-model="securityDialogProps.show"
						:close-on-click-modal="false"
						:title="`账号安全-${securityDialogProps.operLabel}`"
					>
						<InfoBind
							v-if="infoMode !== 'pwd'"
							:type="infoMode"
							:modal-dialog-props="securityDialogProps"
							v-model:secret-serial="editTemplateIns.formData[infoMode]"
						/>
						<RevisePwd
							v-else
							mode="revise"
						/>
					</ElDialog>
				</ElCard>
			</ElSpace>
		</template>

		<!-- do not display default commit button -->
		<template #operations />
	</EditTemplate>
</template>

<style scoped lang="css">
	.edit-template.personal {
		padding: 2em 10vw 1em;
	}

	.edit-template .el-space,
	.edit-template .el-space :deep(.el-space__item) {
		width: 100%;
	}

	.edit-template .edit-item {
		margin-bottom: 0.5em;
	}
	.edit-template .base .edit-item {
		margin-bottom: 0em;
	}
	.edit-template.edit .base .edit-item.name {
		margin-bottom: 0.5em;
	}

	/* base card, avatar and base info */
	.edit-template .base :deep(.el-card__body) {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: row;
	}
	.edit-template .base .avatar :deep(.ao-upload) {
		height: 200px;
		width: 200px;
	}
	.edit-template .base .avatar :deep(.el-upload) {
		border-radius: 50%;
	}
	.edit-template .base .info {
		flex-grow: 1;
		overflow: hidden;
		padding: 0 2em;
		transition: 0.5s cubic-bezier(0.075, 0.82, 0.165, 1);
	}

	.base .info .profile {
		max-height: 6em;
	}
	.profile :deep(.el-form-item__content > span),
	.profile :deep(.el-form-item__content > .el-input) {
		margin-top: 0.4em;
		word-wrap: break-word;
		line-height: 1.25em;
	}
	.profile :deep(span::-webkit-scrollbar) {
		display: none;
	}

	/* common card */
	.el-card .operation {
		float: right;
	}
	.el-container .el-aside {
		padding: 20px;
		display: flex;
		align-items: center;
		width: max-content;
		padding-right: 0;
	}
	.el-container .el-main .name {
		font-size: 20px;
	}
	.el-card.security .el-aside :deep(.iconfont) {
		font-size: 72px;
	}

	/* security card */
	.el-card.security .bind-tip p {
		line-height: 1.5;
	}
	.el-card.security .bind-tip .state {
		color: var(--el-color-danger);
	}
	.el-card.security .bind-tip .state.has-value {
		color: var(--el-color-primary);
	}
	.el-card.security .bind-value {
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.el-card.security .bind-operation {
		display: flex;
		align-items: center;
		justify-content: flex-end;
	}
</style>
