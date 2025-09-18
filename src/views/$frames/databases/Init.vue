<!-- @format -->

<script setup lang="ts">
	import type { Result } from "@/common/utils/Result";
	import type { KeyStringObject } from "@/common/utils";
	import type { SubmitCallback, UpdatingFormDataHandler } from "../templates";

	import KButton from "@/components/KButton.vue";
	import { ElInput, ElDialog } from "element-plus";
	import EditTemplate from "../templates/EditTemplate.vue";

	import { Databases } from ".";
	import { computed, ref } from "vue";
	import { KasConfig } from "@/configs";
	import { useRouter } from "vue-router";
	import { specialRoute } from "@/router";
	import { EmptyObject } from "@/common/utils";
	import { axiosRequest } from "@/common/utils/Network";

	const router = useRouter();
	const rawData: KeyStringObject = {};

	const logContent = ref("");
	const showLogDialog = ref(false);
	const executingLoading = ref(false);
	const executedResult = ref<Result>();
	const editTemplateIns = ref<InstanceType<typeof EditTemplate>>(EmptyObject);

	const disabled = computed(() => {
		return executedResult.value && executedResult.value.success;
	});

	const submitHandler: SubmitCallback = (result) => {
		executingLoading.value = false;
		executedResult.value = result;
		if (executedResult.value?.success) {
			Databases.setInitFlag(true);
		} else if (!executedResult.value?.data) {
			executedResult.value = undefined;
		}
		return "alert";
	};

	const updatingFormDataHandler: UpdatingFormDataHandler = async (data, base, _) => {
		const result = await axiosRequest({
			method: "GET",
			url: Databases.initUrl,
			extraOptions: {
				alwaysShowFeedbackMsg: false,
			},
		});

		if (!result.success) {
			router.replace({ name: specialRoute.home.name });
			return;
		}

		Object.assign(rawData, result.data);
	};

	async function submit() {
		const result = await editTemplateIns.value?.submit();
		if (result === "confirm") {
			executingLoading.value = true;
		}
	}

	function onClickSeeLog() {
		if (!executedResult.value) return;
		logContent.value = executedResult.value.data;
		showLogDialog.value = true;
	}
</script>

<template>
	<div class="content">
		<header>
			<img :src="KasConfig.sysIcon" />
			<span>{{ KasConfig.sysTitle }}</span>
		</header>
		<div class="tips">
			<p>欢迎使用 {{ KasConfig.sysTitle }}，在您使用该系统前，请先完成系统的初始化向导。</p>
		</div>
		<div
			v-if="executedResult && executedResult.success"
			class="tips success"
		>
			<p>系统初始化成功！刷新页面即可跳转登录界面。</p>
		</div>
		<EditTemplate
			ref="editTemplateIns"
			mode="edit"
			title="提交"
			:raw-data="rawData"
			:action="Databases.initUrl"
			:fields="Databases.initFields"
			label-position="top"
			@submit="submitHandler"
			@updating-form-data="updatingFormDataHandler"
		>
			<template #tips>
				<p>以上部分信息由于系统配置固定而无法修改</p>
				<p>数据库初始化用户仅做初始化使用，请确保您有足够的权限进行系统初始化</p>
			</template>

			<template #operations>
				<KButton
					:loading="executingLoading"
					:disabled="disabled"
					@click="submit"
				>
					{{ executingLoading ? "正在执行初始化..." : "立即提交" }}
				</KButton>
			</template>
		</EditTemplate>
		<p
			v-if="executedResult"
			class="see-log"
			@click="onClickSeeLog"
		>
			查看日志
		</p>
		<ElDialog
			draggable
			destroy-on-close
			title="日志"
			width="90%"
			v-model="showLogDialog"
			:align-center="true"
			:close-on-click-modal="false"
		>
			<ElInput
				resize="none"
				type="textarea"
				:rows="30"
				:readonly="true"
				:value="logContent"
			/>
		</ElDialog>
	</div>
</template>

<style scoped lang="css">
	.content {
		width: 100%;
		display: flex;
		align-items: center;
		flex-direction: column;
		padding: 4em 0;
		gap: 1em;
	}

	header {
		font-size: 2em;
	}
	header img {
		width: 1.5em;
		height: 1.5em;
		margin-right: 0.5em;
	}
	header * {
		vertical-align: middle;
	}
	.edit-template {
		width: max-content;
	}
	.edit-template :deep(.el-row) {
		width: 25em;
		margin-left: auto;
		margin-right: auto;
	}
	.tips {
		font-size: 1.2em;
		line-height: 1.5;
		width: 30em;
		text-indent: 2em;
	}
	.tips.success {
		color: var(--primary-color);
	}
	.see-log {
		cursor: pointer;
		color: var(--el-color-primary);
		text-decoration: underline;
		margin-top: -1.8em;
	}
</style>
