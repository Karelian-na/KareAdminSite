<!-- @format -->

<script setup lang="ts">
	import type { Ref } from "vue";
	import type { ISettings, IUserInfo } from "@/common";
	import type { BeforeLeaveCallback, Fields, IField } from "../templates";

	import { ElRadioGroup, ElRadio } from "element-plus";
	import EditTemplate from "../templates/EditTemplate.vue";

	import { inject, ref, watchEffect } from "vue";
	import { axiosRequest } from "@/common/utils/Network";
	import { confirm, success, error } from "@/common/utils/Interactive";

	const userInfo = inject<Ref<IUserInfo>>("userInfo")!;

	const editTemplateIns = ref<InstanceType<typeof EditTemplate>>();

	const settingsFields: Record<keyof ISettings, Partial<IField>> = {
		theme: {
			config: {
				index: 1,
				type: "radio",
				layoutSpan: 24,
				enumItems: [
					{ label: "浅色", value: "light" },
					{ label: "深色", value: "dark" },
				],
			},
			field_name: "theme",
			display_name: "主题",
			editable: true,
		},
	};

	defineExpose({ onExit });

	watchEffect(() => {
		if (editTemplateIns.value?.formData.theme) {
			userInfo.value.preferences.theme = editTemplateIns.value.formData.theme;
		}
	});

	function onExit() {
		return editTemplateIns.value?.askIfNeedToLeave();
	}

	const onTemplateBeforLeave: BeforeLeaveCallback = async function (data, base) {
		const res = base();

		if (res) {
			return true;
		}

		let action = "";
		try {
			action = await confirm("是否保存所作更改？");
		} catch (error) {}
		if (action !== "confirm") {
			Object.assign(userInfo.value.preferences, editTemplateIns.value!.initFormData);
			return true;
		}

		axiosRequest({
			method: "PUT",
			url: "/self/edit",
			data: {
				id: userInfo.value.id,
				preferences: JSON.stringify(editTemplateIns.value?.formData),
			},
			extraOptions: {
				alwaysShowFeedbackMsg: false,
			},
			callback: (result) => {
				if (result.success) {
					success("msg", { message: "保存成功!" });
				} else {
					error("msg", { message: `保存失败! ${result.msg ?? ""}` });
				}
			},
		});

		return true;
	};
</script>

<template>
	<EditTemplate
		ref="editTemplateIns"
		mode="edit"
		action="/self/preferences"
		title="设置"
		@before-leave="onTemplateBeforLeave"
		:fields="(settingsFields as Fields)"
		:raw-data="userInfo.preferences"
	>
		<template #theme-input="{ controlIns, modelValue, disabled, updateModelValue }">
			<ElRadioGroup
				:ref="controlIns"
				:model-value="(modelValue as any)"
				:disabled="disabled"
				@update:model-value="updateModelValue"
			>
				<div class="theme-item">
					<ElRadio label="light">浅色</ElRadio>
					<div
						class="theme-mockup"
						data-theme="light"
					>
						<div class="mockup-sidebar"></div>
						<div class="mockup-main">
							<div class="mockup-header"></div>
							<div class="mockup-card"></div>
							<div class="mockup-btn"></div>
						</div>
					</div>
				</div>
				<div class="theme-item">
					<ElRadio label="dark">深色</ElRadio>
					<div
						class="theme-mockup"
						data-theme="dark"
					>
						<div class="mockup-sidebar"></div>
						<div class="mockup-main">
							<div class="mockup-header"></div>
							<div class="mockup-card"></div>
							<div class="mockup-btn"></div>
						</div>
					</div>
				</div>
			</ElRadioGroup>
		</template>
		<template #operations></template>
	</EditTemplate>
</template>

<style scoped lang="css">
	.edit-template :deep(.el-radio) {
		margin-right: 0;
	}

	.theme-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin: 0 1em;
	}

	.theme-mockup {
		display: inline-flex;
		width: 5em;
		height: 2.5em;
		border-radius: 6px;
		margin-top: 0.5em;
		overflow: hidden;
		border: 1px solid var(--border-color);
	}
	.mockup-sidebar {
		width: 1em;
		height: 100%;
		background: var(--background-color-1);
	}
	.mockup-main {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		padding: 3px 5px;
		box-sizing: border-box;
		background-color: var(--background-color);
	}
	.mockup-header {
		width: 90%;
		height: 0.5em;
		border-radius: 2px;
		margin-bottom: 4px;
		background: var(--border-color);
	}
	.mockup-card {
		width: 80%;
		height: 0.8em;
		border-radius: 2px;
		margin-bottom: 4px;
		background: var(--hover-border-color);
	}
	.mockup-btn {
		width: 60%;
		height: 0.4em;
		border-radius: 3px;
		background: var(--primary-color);
	}
</style>
