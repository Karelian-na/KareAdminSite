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

<style lang="css">
	.ao-tag {
		display: inline-block;
		color: var(--contrasted-text-color);
		background-color: var(--primary-color);
		padding: 0.4em;
		border-radius: 0.5em;
		font-size: 0.8em;
		white-space: nowrap;
	}

	.ao-tag + .ao-tag {
		margin-left: 0.5em;
	}
</style>
