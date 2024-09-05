<!-- @format -->

<script setup lang="ts">
	const props = defineProps<{
		value?: string;
		type?: "font" | "svg";
	}>();

	const isUri = /^(https?|ftp):\/\/([a-zA-Z0-9.-]+)(:[0-9]+)?(\/[^\s]*)?$/.test(props.value ?? "");
</script>

<template>
	<template v-if="/^[\w-]+$/.test(value ?? '')">
		<svg
			v-if="type === 'svg'"
			class="icon"
			aria-hidden="true"
		>
			<use :xlink:href="`#icon-${value}`" />
		</svg>
		<i
			v-else
			class="iconfont"
			:class="`icon-${value}`"
			v-bind="$attrs"
		/>
	</template>
	<i
		v-else-if="isUri"
		class="iconfont"
	>
		<img
			:src="value"
			class="icon"
			v-bind="$attrs"
			alt=""
		/>
	</i>
	<i
		v-else
		class="iconfont icon-none"
		v-bind="$attrs"
	/>
</template>

<style scoped lang="css">
	.iconfont {
		display: inline-block;
		text-align: center;
		vertical-align: baseline;
		letter-spacing: 0;
		font-size: inherit;
		color: inherit;
	}

	.icon {
		width: 1em;
		height: 1em;
		vertical-align: -0.15em;
		fill: currentColor;
		overflow: hidden;
	}
</style>
