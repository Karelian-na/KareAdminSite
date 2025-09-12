<!-- @format -->

<script setup lang="ts">
	import type { IndexTemplateProps, OperColumnButtonClickHandler, PageInfoHandler } from "@/views/$frames/templates";

	import KTag from "@/components/KTag.vue";
	import IndexTemplate from "@/views/$frames/templates/IndexTemplate.vue";

	import { ref } from "vue";
	import { EmptyObject } from "@/common/utils";

	const props = defineProps<IndexTemplateProps>();

	const onPageInfoHandled: PageInfoHandler = function (pageProps) {
		if (pageProps.operColumnButtons["delete"]) {
			pageProps.operColumnButtons["delete"].condition = (data) => data["id"] >= 100;
		}
	};

	const onOperColumnButtonClick: OperColumnButtonClickHandler = function (button, param, buttons) {
		return false;
	};

	const indexTemplateIns = ref<InstanceType<typeof IndexTemplate>>(EmptyObject);
</script>

<template>
	<IndexTemplate
		v-bind="props"
		ref="indexTemplateIns"
		:local-search="true"
		:no-pagination="true"
		:selection-column-props="{ selectable: (row) => row['id'] >= 100 }"
		@page-info-handled="onPageInfoHandled"
		@oper-column-button-click="onOperColumnButtonClick"
	>
		<template #status="{ data }">
			<KTag
				:label="data['status'] ? '启用' : '禁用'"
				:class="data['status'] ? 'enabled' : 'disabled'"
			></KTag>
		</template>

		<template #oper_type="{ data }">
			<template v-if="Number.isInteger(data['oper_type'])">
				<KTag
					v-if="data['oper_type'] & 1"
					label="批量操作"
					class="batch"
				/>
				<KTag
					v-if="data['oper_type'] & 2"
					label="单一操作"
					class="single"
				/>
			</template>
		</template>
	</IndexTemplate>
</template>

<style scoped lang="css">
	.ao-tag.single {
		background-color: darkcyan;
	}
	.ao-tag.batch {
		background-color: darkorange;
	}

	.ao-tag.enabled {
		background-color: var(--primary-color);
	}
	.ao-tag.disabled {
		background-color: var(--danger-color);
	}
</style>
