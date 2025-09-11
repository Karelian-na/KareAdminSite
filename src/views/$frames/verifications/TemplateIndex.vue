<!-- @format -->

<script setup lang="ts">
	import type { IndexTemplateProps } from "@/views/$frames/templates";

	import { PageInfoHandler } from "@/views/$frames/templates";

	import IndexTemplate from "@/views/$frames/templates/IndexTemplate.vue";

	const props = defineProps<IndexTemplateProps>();

	const onPageInfoHandled: PageInfoHandler = function (pageInfo) {
		const deleteBtn = pageInfo.operColumnButtons["delete"];
		if (deleteBtn) {
			deleteBtn.condition = (row) => {
				return row["id"] >= 100;
			};
		}
	};
</script>

<template>
	<IndexTemplate
		v-bind="props"
		@page-info-handled="onPageInfoHandled"
	></IndexTemplate>
</template>
