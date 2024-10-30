<!-- @format -->

<script setup lang="ts">
	import { KasConfig } from "@/configs";
	import { Constants } from "@/common/utils/Constants";

	defineProps<{
		value?: string;
		type?: "font" | "svg";
	}>();
</script>

<template>
	<template v-if="!value || KasConfig.iconfont.valueRegex.test(value)">
		<svg
			v-if="type === 'svg'"
			class="icon"
			aria-hidden="true"
		>
			<use :xlink:href="`#${KasConfig.iconfont.prefix}${value}`" />
		</svg>
		<i
			v-else
			class="iconfont"
			:class="`${KasConfig.iconfont.prefix}${value}`"
			v-bind="$attrs"
		/>
	</template>
	<i
		v-else-if="Constants.externalLinkRegex.test(value)"
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
		:class="`iconfont ${KasConfig.iconfont.prefix}none`"
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
