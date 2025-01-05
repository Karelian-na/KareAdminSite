<!-- @format -->

<script setup lang="ts">
	import type { IndexTemplateProps, OperbarButtonClickHandler, OperColumnButtonClickHandler } from "../templates";

	import TpManage from "./Manage.vue";
	import IndexTemplate from "@/views/$frames/templates/IndexTemplate.vue";

	import { ref } from "vue";
	import { EmptyObject } from "@/common/utils";
	import { confirm } from "@/common/utils/Interactive";
	import { adminRequest } from "@/common/utils/Network";

	const props = defineProps<IndexTemplateProps>();

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

	const onOperColumnButtonClick: OperColumnButtonClickHandler = function (button, param, buttons, modalDialogProps) {
		switch (button.type) {
			case "details":
				modalDialogProps!.action = props.url;
				break;
			default:
				break;
		}
		return false;
	};
</script>

<template>
	<IndexTemplate
		v-bind="props"
		ref="indexTemplateIns"
		:no-pagination="true"
		@operbar-button-click="onOperbarButtonClick"
		@oper-column-button-click="onOperColumnButtonClick"
	>
		<template #editContent="attrs">
			<TpManage
				v-if="['edit', 'details'].includes(attrs.mode)"
				v-bind="(attrs.modalDialogProps.width = 850) && attrs"
			/>
		</template>
	</IndexTemplate>
</template>
