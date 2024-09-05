<!-- @format -->

<script setup lang="ts">
	import type { KeyStringObject } from "@/common/utils";
	import type { EditTemplateProps, CollectingPostDataHandler, UpdatingFormDataHandler } from "@/views/templates";

	import { ElTransfer } from "element-plus";
	import EditTemplate from "@/views/templates/EditTemplate.vue";

	import { ref } from "vue";
	import { ObjectUtils } from "@/common/utils/Object";
	import { adminRequest } from "@/common/utils/Network";

	interface Option {
		key: number;
		label: string;
	}

	const props = defineProps<EditTemplateProps>();

	const roles = ref<Option[]>([]);
	const assignedRoles = ref<number[]>([]);

	const onUpdatingFormData: UpdatingFormDataHandler = async function (rawData, base, modalDialogProps) {
		const formData: KeyStringObject = { ids: Array.isArray(rawData) ? rawData.map((item) => item["id"]) : [rawData!["id"]] };

		await adminRequest({
			url: props.modalDialogProps!.action,
			method: "GET",
			extraOptions: {
				loading: modalDialogProps!.loading,
				alwaysShowFeedbackMsg: false,
			},
			params: { ids: formData.ids.join(",") },
			callback: (result) => {
				if (!result.success) {
				}

				roles.value = (result.data.roles as Array<KeyStringObject>).map((item) => ({
					key: item["id"],
					label: item["name"],
					disabled: [1, 99].includes(item["id"]),
				}));
				assignedRoles.value = result.data.common;
				formData["roles"] = ObjectUtils.clone(result.data.common);
			},
		});

		return formData;
	};

	const onCollectingPostData: CollectingPostDataHandler = function (formData, postData) {
		const newPostData = {
			ids: Array.isArray(props.rawData) ? props.rawData.map((item) => item.id) : [props.rawData!["id"]],
			auths: {} as KeyStringObject,
		};
		const data = postData.value["roles"] as Array<number>;
		assignedRoles.value.forEach((item) => {
			const idx = data.indexOf(item);
			if (idx === -1) {
				newPostData.auths[item] = 0;
			} else {
				data.remove(idx);
			}
		});
		data.forEach((item) => {
			newPostData.auths[item] = 1;
		});

		postData.value = newPostData;
	};
</script>

<template>
	<EditTemplate
		v-bind="props"
		@updating-form-data="onUpdatingFormData"
		@collecting-post-data="onCollectingPostData"
	>
		<template #roles="{ formData }">
			<ElTransfer
				v-model="formData['roles']"
				:data="roles"
				:titles="['角色列表', '已赋予的角色']"
			/>
		</template>
	</EditTemplate>
</template>

<style scoped lang="css"></style>
