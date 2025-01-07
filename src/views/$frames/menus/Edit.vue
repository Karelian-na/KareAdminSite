<!-- @format -->

<script setup lang="ts">
	import type { Nullable } from "@/common/utils";
	import type { EditTemplateProps, IEnumItem, PreparedCallback, UpdatingFormDataHandler } from "@/views/$frames/templates";

	import KTag from "@/components/KTag.vue";
	import IconFont from "@/components/IconFont.vue";
	import IconSelector from "@/components/IconSelector.vue";
	import { ElInput, ElSelect, ElOption } from "element-plus";
	import EditTemplate from "@/views/$frames/templates/EditTemplate.vue";

	import { Menu, MenuType } from ".";
	import { KasConfig } from "@/configs";
	import { EmptyObject } from "@/common/utils";
	import { ref, computed, nextTick } from "vue";
	import { ObjectUtils } from "@/common/utils/Object";
	import { Constants } from "@/common/utils/Constants";

	const props = defineProps<
		EditTemplateProps & {
			rawData: Menu;
			topLevelMenus: Array<Menu>;
			parentableMenus: Array<Menu>;
		}
	>();

	let pType = 0;

	const editTemplate = ref<InstanceType<typeof EditTemplate>>(EmptyObject);

	const onTemplatePrepared: PreparedCallback = function (formData, fields) {
		fields["pid"].config.enumItems = props.parentableMenus.reduce(
			(prev, cur) => {
				prev.push({
					value: cur.id,
					label: cur.name,
					disabled: isParentDisabled(cur),
					type: cur.type,
					level: cur.level,
					isExternalLink: cur.isExternalLink(),
				});
				return prev;
			},
			[{ value: 0, label: "无父菜单", disabled: isParentDisabled(null) }] as IEnumItem[]
		);

		if (props.modalDialogProps!.mode === "details") {
			return;
		}
		fields["type"].config.bindProps.disabled = Boolean(props.rawData.id);
		fields["type"].config.enumItems!.forEach((item, idx) => {
			(item as IEnumItem).disabled = isTypeDisabled(idx + 1);
		});

		fields["pid"].config.bindProps.onChange = onParentChange;
		fields["pid"].config.bindProps.disabled = Boolean(!props.rawData.id && props.rawData.pid);

		ObjectUtils.mergeAttributes(fields["oper_type"].config, "bindProps", {
			disabled: computed(() => formData["type"] != MenuType.Oper),
		});

		ObjectUtils.mergeAttributes(fields["pmid"].config, "bindProps", {
			disabled: computed(() => formData["type"] == MenuType.Menu),
		});

		ObjectUtils.mergeAttributes(fields["oper_type"].config, "bindProps", {
			disabled: computed(() => Boolean(formData["type"] != MenuType.Oper || formData["pmid"])),
		});

		ObjectUtils.mergeAttributes(fields["url"].config, "bindProps", {
			disabled: computed(() => formData["type"] == MenuType.Menu),
		});
	};

	const onUpdatingFormData: UpdatingFormDataHandler = function (rawData, base, modalDialogProps) {
		// never occurred
		if (!rawData || Array.isArray(rawData)) {
			console.error("rawData must be an object, but current type is", typeof rawData);
			return {};
		}

		const formData = modalDialogProps!.mode !== "add" ? base(rawData, "children", "parent") : rawData;

		formData["oper_type"] = rawData.oper_type ?? 0;
		formData["pid"] = rawData.pid ?? 0;
		formData["type"] = rawData.type;

		if (!rawData["id"] && formData["pid"]) {
			const permi = props.parentableMenus.find((val) => val.id == formData["pid"])!;
			pType = permi.type;
			formData["url"] = permi.url;
			formData["type"] = pType + 1;
		}

		if (formData["ref_id"]) {
			const refMenu = Menu.find(formData["ref_id"], props.topLevelMenus);
			if (refMenu) {
				formData["url"] = refMenu.url;
			}
		}

		return formData;
	};

	function isTypeDisabled(type: number) {
		if (props.rawData.id) {
			return true;
		}
		switch (pType) {
			case 0:
				return type >= MenuType.Page;
			case MenuType.Menu:
				return type == MenuType.Page;
			case MenuType.Item:
			case MenuType.Page:
				return type <= pType;
			default:
				return true;
		}
	}

	function onParentChange(pid: number) {
		if (props.rawData.id) {
			return;
		}

		let newUrl = "#";
		if (pid) {
			const permi = props.parentableMenus.find((val) => val.id == pid)!;
			if (permi.type != pType) {
				pType = permi.type;
			}
			newUrl = permi.url;
		} else {
			pType = 0;
		}
		props.fields["type"].config.enumItems?.forEach((item, idx) => {
			(item as IEnumItem).disabled = isTypeDisabled(idx + 1);
		});

		nextTick(() => {
			editTemplate.value.updateFormData({
				url: newUrl,
				type: pType + 1,
			});
		});
	}

	function isParentDisabled(menu: Nullable<Menu>) {
		// external link
		if (menu?.url && menu.isExternalLink()) {
			return true;
		}

		if (!props.rawData["id"]) {
			if (!props.rawData["pid"]) {
				return false; // add
			}
			return true; // add with parent, not effect, because of pid is disabled
		}

		// if the parent option is null, means the current menu is a top-level menu, only `Menu` and `Item`'s parent can be null
		if (!menu) {
			const formData = editTemplate.value?.formData;
			return formData?.["type"] >= MenuType.Page;
		}

		return props.rawData.isPage() && menu?.isMenu(); // edit
	}
</script>

<template>
	<EditTemplate
		ref="editTemplate"
		v-bind="props"
		@prepared="onTemplatePrepared"
		@updating-form-data="onUpdatingFormData"
	>
		<template #icon-display="{ formData }">
			<p class="detail-icon">
				<IconFont :value="formData['icon']" />
				<span>&nbsp;{{ formData["icon"] }}</span>
			</p>
		</template>
		<template #icon-input="{ field, formData }">
			<IconSelector
				v-model="formData['icon']"
				:req-url="KasConfig.iconfont.libUrl"
			>
				<ElInput
					v-model="formData['icon']"
					v-bind="field.config.bindProps"
				>
					<template #prepend>
						<IconFont :value="formData['icon']" />
					</template>
				</ElInput>
			</IconSelector>
		</template>

		<template #type-display="{ field, formData }">
			<p>
				<KTag
					class="type"
					:class="Menu.typeFieldNameOf(formData['type'])"
					:icon="Menu.typeFieldNameOf(formData['type'])"
					:label="field.config.enumItems?.find((item: any) => item.value === formData['type'])?.label ?? ''"
				/>
			</p>
		</template>
		<template #type-input="{ field, formData }">
			<ElSelect
				v-model="formData['type']"
				v-bind="field.config.bindProps"
			>
				<ElOption
					v-for="item in field.config.enumItems"
					:label="item.label"
					:value="item.value"
					:disabled="(item.disabled as any)"
				>
					<KTag
						class="type"
						:class="Menu.typeFieldNameOf(item.value as any)"
						:icon="Menu.typeFieldNameOf(item.value as any)"
						:label="item.label"
					/>
				</ElOption>
			</ElSelect>
		</template>

		<template #pid-display="{ field, value }">
			<span v-if="!value">无父菜单</span>
			<span v-else>{{ field.config.enumItems?.find((item) => item.value === value)?.label }}</span>
		</template>
		<template #pid-input="{ field, formData }">
			<ElSelect
				v-model="formData['pid']"
				v-bind="field.config.bindProps"
			>
				<ElOption
					v-for="item in field.config.enumItems"
					:label="item.label"
					:value="item.value"
					:disabled="(item.disabled as any)"
				>
					<template v-if="item.value != 0">
						<span :style="`margin-left: ${23 * (item['level'] - 1)}px`">{{ `|— ${item["label"]}` }}</span>
						<IconFont
							v-if="item['isExternalLink']"
							value="external-link"
						/>
						<KTag
							class="type"
							:class="Menu.typeFieldNameOf(item['type'])"
							:icon="Menu.typeFieldNameOf(item['type'])"
							:label="Menu.typeNameOf(item['type'])"
						/>
					</template>
					<template v-else>无父菜单</template>
				</ElOption>
			</ElSelect>
		</template>

		<template #url-display="{ formData }">
			<template v-if="formData['url']">
				<a
					v-if="Constants.externalLinkRegex.test(formData['url'])"
					:href="formData['url']"
					target="__blank"
					>{{ formData["url"] }}</a
				>
				<template v-else>{{ formData["url"] }}</template>
			</template>
			<template v-else-if="formData['ref_id']">引用菜单 {{ formData["ref_id"] }}</template>
		</template>

		<template #tips>
			<p>1. 若当前权限类型为菜单或选项, 则其父权限类型必须为菜单或无;</p>
			<p>2. 若当前权限类型为标签, 则其父权限类型必须为选项;</p>
			<p>3. 若当前权限类型为操作, 则其父权限类型不能为操作;</p>
			<p>4. 当操作类型权限的父权限类型为菜单或选项时, 该权限对其所有兄弟权限生效;</p>
			<p>5. 当菜单关联权限时, 操作类型由关联的权限决定; 不关联权限时,可修改菜单的操作类型.</p>
		</template>
	</EditTemplate>
</template>

<style scoped lang="css">
	.detail-icon {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.el-form-item :deep(.el-input-group__prepend .iconfont) {
		line-height: 1em;
	}

	.el-select.type {
		width: 8.5em;
	}
	.el-select .ao-tag.type {
		margin-left: 1em;
	}

	.el-select :deep(.iconfont.icon-external-link) {
		vertical-align: bottom;
		margin-left: 5px;
	}
</style>
