<!-- @format -->

<script setup lang="ts">
	import IconFont from "@/components/IconFont.vue";

	defineProps<{
		label: string;
		icon?: string;
	}>();
</script>

<template>
	<span class="ao-tag">
		<IconFont
			v-if="icon"
			:value="icon"
		/>
		{{ label }}
	</span>
</template>

<style>
	.ao-tag {
		padding: 5px;
		color: white;
		background-color: var(--el-color-primary);
		border-radius: 5px;
		font-size: 12px;
		vertical-align: initial;
		white-space: nowrap;
	}

	.ao-tag+.ao-tag {
		margin-left: 0.5em;
	}
</style>
