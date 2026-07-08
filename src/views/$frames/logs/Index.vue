<!-- @format -->

<script setup lang="ts">
	import type { EditTemplateProps, IndexTemplateProps, IOperButton, PageInfoHandler } from "@/views/$frames/templates";

	import KTag from "@/components/KTag.vue";
	import LogDetails from "@/views/$frames/logs/Details.vue";
	import IndexTemplate from "@/views/$frames/templates/IndexTemplate.vue";

	import { ref } from "vue";

	const props = defineProps<IndexTemplateProps>();
	const decryptButton = ref<IOperButton>();

	function getRequestTimeConsumingLevel(value: number): string {
		if (value < 100) {
			return "normal";
		} else if (value < 500) {
			return "medium";
		} else {
			return "danger";
		}
	}

	const onPageInfoHandled: PageInfoHandler = function (pageProps) {
		decryptButton.value = pageProps.operColumnButtons.decrypt;
		delete pageProps.operColumnButtons.decrypt;
		props.onPageInfoHandled?.(pageProps);
	};

	function handleDetailTemplateAttrs(attrs: EditTemplateProps) {
		if (attrs.modalDialogProps) {
			attrs.modalDialogProps.width = 860;
		}
		return attrs;
	}
</script>

<template>
	<IndexTemplate
		v-bind="props"
		:selection-column-props="{ fixed: true }"
		@page-info-handled="onPageInfoHandled"
	>
		<template #type="{ value }">
			<template v-if="value">
				<KTag
					:label="value"
					:class="value"
				/>
			</template>
		</template>

		<template #time_consuming="{ value }">
			<template v-if="value">
				<KTag
					:label="`${value} ms`"
					:class="getRequestTimeConsumingLevel(value)"
				/>
			</template>
		</template>

		<template #status="{ value }">
			<template v-if="value !== undefined">
				<KTag
					:class="value ? 'success' : 'fail'"
					:label="value ? '成功' : '失败'"
				/>
			</template>
		</template>

		<template #editContent="attrs">
			<LogDetails
				v-if="attrs.mode === 'details'"
				v-bind="handleDetailTemplateAttrs(attrs)"
				:decrypt-button="decryptButton"
			/>
			<slot
				v-else
				name="editContent"
				v-bind="attrs"
			></slot>
		</template>
	</IndexTemplate>
</template>

<style lang="css" scoped>
	.index-template :deep(.url) {
		max-width: 25em;
	}
	.index-template :deep(.url .cell) {
		width: auto !important;
	}

	.ao-tag.GET {
		background-color: green;
	}

	.ao-tag.PUT {
		background-color: blue;
	}

	.ao-tag.DELETE {
		background-color: darkred;
	}

	.ao-tag.POST {
		background-color: orange;
	}

	.index-template :deep(.time_consuming) {
		color: white;
	}
	.ao-tag.normal {
		background-color: #40a9ff;
	}
	.ao-tag.medium {
		background-color: #faad14;
	}
	.ao-tag.danger {
		background-color: darkred;
	}

	.ao-tag.success {
		background-color: #52c41a;
	}
	.ao-tag.fail {
		background-color: darkred;
	}
</style>
