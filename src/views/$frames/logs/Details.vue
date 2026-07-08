<!-- @format -->

<script lang="ts">
	type DecryptedLogContent = {
		params?: unknown;
		response?: unknown;
	};

	const decryptedLogCache = new Map<string | number, DecryptedLogContent>();
</script>

<script setup lang="ts">
	import type { EditTemplateProps, IOperButton, UpdatingFormDataHandler } from "@/views/$frames/templates";
	import type { KeyStringObject } from "@/common/utils";

	import { computed, ref, watch } from "vue";
	import { ElButton } from "element-plus";
	import EditTemplate from "@/views/$frames/templates/EditTemplate.vue";

	import { ObjectUtils } from "@/common/utils/Object";
	import { axiosRequest } from "@/common/utils/Network";
	import { error } from "@/common/utils/Interactive";

	const props = defineProps<
		EditTemplateProps & {
			decryptButton?: IOperButton;
		}
	>();

	const decrypted = ref(false);
	const decrypting = ref(false);
	const originalParams = ref<unknown>();
	const originalResponse = ref<unknown>();
	const editTemplateProps = computed(() => {
		const { decryptButton, ...attrs } = props;
		return attrs;
	});
	const showDecryptButton = computed(() => Boolean(props.decryptButton && props.rawData?.encrypted));

	const onUpdatingFormData: UpdatingFormDataHandler = function (rawData, base) {
		const data = props.onUpdatingFormData?.(rawData, base, props.modalDialogProps) ?? base(rawData as KeyStringObject);
		if (data instanceof Promise) {
			return data.then(updateOriginalParams);
		}
		return updateOriginalParams(data);
	};

	watch(
		() => props.rawData,
		() => {
			decrypted.value = false;
			decrypting.value = false;
			originalParams.value = props.rawData?.params;
			originalResponse.value = props.rawData?.response;
		},
		{ deep: true },
	);

	function updateOriginalParams(data: KeyStringObject) {
		decrypted.value = false;
		decrypting.value = false;
		originalParams.value = ObjectUtils.clone(data).params;
		originalResponse.value = ObjectUtils.clone(data).response;
		return data;
	}

	function getLogId() {
		return props.rawData?.id as string | number | undefined;
	}

	function restore(formData: KeyStringObject) {
		formData.params = originalParams.value;
		formData.response = originalResponse.value;
		decrypted.value = false;
	}

	async function toggleDecrypt(formData: KeyStringObject) {
		if (decrypted.value) {
			restore(formData);
			return;
		}

		const id = getLogId();
		if (id === undefined) {
			return;
		}

		if (decryptedLogCache.has(id)) {
			applyDecryptedContent(formData, decryptedLogCache.get(id)!);
			decrypted.value = true;
			return;
		}

		decrypting.value = true;
		const result = await axiosRequest({
			method: "GET",
			url: props.decryptButton?.action ?? "/admin/logs/decrypt",
			params: { id },
			extraOptions: {
				loading: props.modalDialogProps?.loading,
				alwaysShowFeedbackMsg: false,
			},
			callback: () => true,
		});
		decrypting.value = false;

		if (!result.success) {
			error("msg", { message: result.msg ?? "解密失败" });
			return;
		}

		const decryptedContent = {
			params: (result.data as any)?.params,
			response: (result.data as any)?.response,
		};
		decryptedLogCache.set(id, decryptedContent);
		applyDecryptedContent(formData, decryptedContent);
		decrypted.value = true;
	}

	function applyDecryptedContent(formData: KeyStringObject, content: DecryptedLogContent) {
		if (content.params !== undefined) {
			formData.params = content.params;
		}
		if (content.response !== undefined) {
			formData.response = content.response;
		}
	}
</script>

<template>
	<EditTemplate
		v-bind="editTemplateProps"
		:on-updating-form-data="onUpdatingFormData"
	>
		<template #front="{ formData }">
			<div
				v-if="showDecryptButton"
				class="actions"
			>
				<ElButton
					type="primary"
					:loading="decrypting"
					@click="toggleDecrypt(formData)"
				>
					{{ decrypted ? "还原参数" : "解密参数" }}
				</ElButton>
			</div>
		</template>
	</EditTemplate>
</template>

<style scoped lang="css">
	.actions {
		display: flex;
		justify-content: flex-end;
		margin-bottom: 1em;
	}
</style>
