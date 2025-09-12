<!-- @format -->

<script setup lang="ts">
	import IconFont from "@/components/IconFont.vue";
	import { ButtonInstance, ElButton } from "element-plus";

	const props = defineProps<{
		icon?: string;
		props?: ButtonInstance["$props"];
	}>();
</script>

<template>
	<ElButton
		v-bind="props.props"
		class="ui-button"
	>
		<template #default>
			<IconFont
				v-if="icon"
				:value="icon"
			/>
			<slot></slot>
		</template>
	</ElButton>
</template>

<style lang="css">
	.ui-button {
		color: var(--contrasted-text-color);
		background-color: var(--primary-color);
		transition: opacity var(--transition-color) ease-in-out;
	}
	.ui-button:hover {
		background-color: var(--primary-color);
		color: var(--contrasted-text-color);
		opacity: 0.8;
	}

	.ui-button.delete,
	.ui-button.bulkdelete {
		background-color: var(--danger-color);
	}
	.ui-button.add,
	.ui-button.edit {
		background-color: chocolate;
	}

	.ui-button.export {
		background-color: chocolate;
	}

	.ui-button.exit,
	.ui-button.cancel,
	.ui-button.close {
		background-color: var(--danger-color);
	}

	.ui-button.transparent {
		color: var(--text-color);
		background-color: transparent;
	}

	.ui-button .iconfont {
		margin-right: 5px;
	}
</style>
