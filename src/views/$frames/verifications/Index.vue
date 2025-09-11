<!-- @format -->

<script setup lang="ts">
	import { TemplateUtils, type IndexTemplateProps } from "@/views/$frames/templates";

	import KTag from "@/components/KTag.vue";
	import IndexTemplate from "@/views/$frames/templates/IndexTemplate.vue";

	const props = defineProps<IndexTemplateProps>();
</script>

<template>
	<IndexTemplate v-bind="props">
		<template #type="{ value, field }">
			<template v-if="value">
				<KTag
					:label="String(TemplateUtils.mapDataValueToLabel(field, value))"
					:class="value"
				/>
			</template>
		</template>

		<template #status="{ value, field }">
			<template v-if="value">
				<KTag
					:label="String(TemplateUtils.mapDataValueToLabel(field, value))"
					:class="value"
				/>
			</template>
		</template>
	</IndexTemplate>
</template>

<style lang="css" scoped>
	.ao-tag.Email {
		background-color: darkslategray;
	}

	.ao-tag.PENDING {
		background-color: coral;
	}

	.ao-tag.FAILED {
		background-color: darkred;
	}

	.ao-tag.UNVERIFY {
		background-color: gray;
	}

	.ao-tag.VERIFIED {
		background-color: blue;
	}

	.ao-tag.USED {
		background-color: green;
	}
</style>
