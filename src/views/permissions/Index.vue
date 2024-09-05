<!-- @format -->

<script setup lang="ts">
	import type { OperColumnButtonClickHandler } from "@/views/templates";

	import AoTag from "@/components/AoTag.vue";
	import IndexTemplate from "@/views/templates/IndexTemplate.vue";

	import { ref } from "vue";
	import { EmptyObject } from "@/common/utils";

	const props = defineProps<{
		url: string;
		head: string;
	}>();

	const onOperColumnButtonClick: OperColumnButtonClickHandler = function (button, param, buttons) {
		return false;
	};

	const indexTemplateIns = ref<InstanceType<typeof IndexTemplate>>(EmptyObject);
</script>

<template>
	<IndexTemplate
		v-bind="props"
		ref="indexTemplateIns"
		:no-pagination="true"
		@oper-column-button-click="onOperColumnButtonClick"
	>
		<template #status="{ data }">
			<AoTag :label="data['status'] ? '启用' : '禁用'"></AoTag>
		</template>

		<template #oper_type="{ data }">
			<template v-if="Number.isInteger(data['oper_type'])">
				<AoTag
					v-if="data['oper_type'] & 1"
					label="批量操作"
					class="batch"
				/>
				<AoTag
					v-if="data['oper_type'] & 2"
					label="单一操作"
					class="single"
				/>
			</template>
		</template>
	</IndexTemplate>
</template>

<style scoped lang="css">
	.index-template .oper_type .ao-tag {
		margin: 0 2px;
	}
	.index-template .oper_type .ao-tag.single {
		background-color: coral;
	}
	.index-template .oper_type .ao-tag.batch {
		background-color: darkgoldenrod;
	}
</style>
