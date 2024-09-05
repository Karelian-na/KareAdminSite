<!-- @format -->

<script setup lang="ts">
	import type { OperbarButtonClickHandler } from "../templates";

	import TpManage from "./Manage.vue";
	import IndexTemplate from "@/views/templates/IndexTemplate.vue";

	import { ref } from "vue";
	import { EmptyObject } from "@/common/utils";
	import { adminRequest } from "@/common/utils/Network";
	import { confirm } from "@/common/utils/Interactive";

	const props = defineProps<{
		url: string;
		head: string;
	}>();

	const indexTemplateIns = ref<InstanceType<typeof IndexTemplate>>(EmptyObject);

	const onOperbarButtonClick: OperbarButtonClickHandler = function (button) {
		switch (button.type) {
			case "reload":
				confirm("确定重新加载字段配置吗？", {
					callback: (action, _) => {
						if (action !== "confirm") {
							return;
						}

						adminRequest({
							url: button.action,
						});
					},
				});
				return true;
			default:
				return false;
		}
	};
</script>

<template>
	<IndexTemplate
		v-bind="props"
		ref="indexTemplateIns"
		:no-pagination="true"
		@operbar-button-click="onOperbarButtonClick"
	>
		<template #editContent="attrs">
			<TpManage
				v-if="['edit', 'details'].includes(attrs.mode)"
				v-bind="attrs"
			/>
		</template>
	</IndexTemplate>
</template>
