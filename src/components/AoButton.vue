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
		<template
			v-if="icon"
			#icon
		>
			<IconFont :value="icon" />
		</template>
		<slot></slot>
	</ElButton>
</template>

<style scoped lang="css">
	:global(.ui-button) {
		--el-button-hover-text-color: white;
		--el-button-hover-bg-color: var(--el-color-primary);

		border: none;
		color: white;
		padding: 10px;
		background-color: var(--el-color-primary);
	}

	:global(.ui-button.delete) {
		background-color: darkred;
	}
	:global(.ui-button.add),
	:global(.ui-button.edit) {
		background-color: chocolate;
	}
</style>
