<!-- @format -->

<script setup lang="ts">
	import { KeyStringObject } from "@/common/utils";
	import type {
		BeforeLeaveCallback,
		CollectingPostDataHandler,
		EditTemplateProps,
		IField,
		RenderedCallback,
		UpdatingFormDataHandler,
	} from "@/views/templates";

	import IconFont from "@/components/IconFont.vue";
	import EditTemplate from "@/views/templates/EditTemplate.vue";
	import { ElTable, ElTableColumn, ElCheckbox, ElInput } from "element-plus";

	import { error } from "@/common/utils/Interactive";
	import { adminRequest } from "@/common/utils/Network";

	const props = defineProps<EditTemplateProps>();

	let draggable = false;
	let draggingItem: HTMLTableRowElement;

	const disabled = props.modalDialogProps?.mode !== "edit";
	const onUpdatingFormData: UpdatingFormDataHandler = async function (rawData, base, modalDialogProps) {
		if (Array.isArray(rawData) || !rawData) {
			return {};
		}

		const formData = base(rawData, "fields");

		await adminRequest({
			url: props.modalDialogProps!.action,
			method: "GET",
			params: {
				viewName: rawData["view_name"],
			},
			extraOptions: {
				loading: modalDialogProps?.loading,
				alwaysShowFeedbackMsg: false,
			},
			callback: (result) => {
				if (!result.success) {
					error("msg", { message: `无法获取库信息，${result.msg}` });
					return;
				}

				const hidden: Array<IField> = [];
				const resFields: Array<IField> = result.data.fields;
				for (let idx = 0; idx < resFields.length; ) {
					const cur = resFields[idx];
					if (!cur.display) {
						hidden.push(resFields.remove(idx));
					} else {
						++idx;
					}
				}
				formData["fields_config"] = result.data.fields_config;
				const fieldsInfo = resFields.sort((l, r) => l.display_order - r.display_order).concat(hidden);
				if (fieldsInfo.length !== 0) {
					formData["fields"] = fieldsInfo.reduce((prev, cur, idx) => {
						prev[cur.field_name] = cur;
						return prev;
					}, {} as KeyStringObject);
				}
			},
		});
		return formData;
	};

	const onEditTemplateRendered: RenderedCallback = function (formData) {
		const fieldsInfo = Object.values(formData.fields) as Array<IField>;
		document.querySelectorAll<HTMLTableRowElement & { data: KeyStringObject }>(".edit-template tbody tr").forEach((item, idx) => {
			item.draggable = true;
			item.data = fieldsInfo[idx];
			item.ondragstart = (e) => {
				if (draggable) {
					draggingItem = item;
					setTimeout(() => {
						item.classList.add("dragging");
					}, 10);
				} else {
					e.preventDefault();
				}
			};

			item.ondragenter = (e) => {
				e.preventDefault();
				if (!draggingItem || draggingItem === e.currentTarget) {
					return;
				}
				if (item.rowIndex < draggingItem.rowIndex) {
					item.insertAdjacentElement("beforebegin", draggingItem);
				} else {
					item.insertAdjacentElement("afterend", draggingItem);
				}
			};

			item.ondragover = (e) => {
				e.dataTransfer!.dropEffect = "move";
			};

			item.ondragend = (e) => {
				item.classList.remove("dragging");
				e.preventDefault();
				draggable = false;
			};
		});
	};

	const onCollectingPostData: CollectingPostDataHandler = function (formData, postData) {
		if (!postData.value["fields"]) {
			postData.value["fields"] = {};
		}

		const fields = postData.value["fields"];
		const initFields = Object.values(formData.init!["fields"]) as Array<IField>;
		document.querySelectorAll<HTMLTableRowElement & { data: KeyStringObject }>(".edit-template tbody tr").forEach((item, idx) => {
			const curFieldName = item.data["field_name"];
			let curField: IField = fields[curFieldName];

			const modelIdx = initFields.findIndex((field) => field.field_name === curFieldName);
			const rawField: IField = initFields[modelIdx];
			if (curField) {
				if (curField.display === false) {
					return;
				}
			} else if (!rawField.display || item.rowIndex - 1 === modelIdx) {
				return;
			}

			const isNeedChangeOrder = item.rowIndex - 1 !== rawField.display_order;
			if (isNeedChangeOrder) {
				if (!curField) {
					fields[curFieldName] = {};
				}
				fields[curFieldName].display_order = idx;
			}
		});
		if (Object.keys(postData.value["fields"]).length === 0) {
			delete postData.value["fields"];
		}
		if (Object.keys(postData.value).length) {
			postData.value["view_name"] = formData.init!["view_name"];
		}
	};

	const onBeforeLeave: BeforeLeaveCallback = function (formData, base) {
		const result = base?.();
		if (result) {
			return result;
		}

		const rows = document.querySelectorAll<HTMLTableRowElement & { data: KeyStringObject }>(".edit-template tbody tr");
		const fieldsInfo = Object.values(formData.init!.fields) as Array<IField>;
		for (let idx = 0; idx < rows.length; idx++) {
			const item = rows[idx];
			if (item.data["display"] && item.rowIndex - 1 !== fieldsInfo.findIndex((field) => field.field_name === item.data["field_name"])) {
				return true;
			}
		}
		return false;
	};

	function onDragHandlerMouseDown() {
		draggable = true;
	}
</script>

<template>
	<EditTemplate
		v-bind="props"
		@before-leave="onBeforeLeave"
		@rendered="onEditTemplateRendered"
		@updating-form-data="onUpdatingFormData"
		@collecting-post-data="onCollectingPostData"
	>
		<template #fields="{ formData }">
			<ElTable
				:data="Object.values(formData.fields)"
				table-layout="auto"
			>
				<ElTableColumn
					width="36px"
					v-if="!disabled"
				>
					<IconFont
						value="movehandler"
						@mousedown="onDragHandlerMouseDown"
					/>
				</ElTableColumn>
				<ElTableColumn
					prop="field_name"
					label="字段名"
					align="center"
					class-name="field_name"
				/>
				<ElTableColumn
					prop="display_name"
					label="展示名"
					align="center"
				>
					<template #default="{ row }">
						<ElInput
							v-if="!disabled"
							v-model="formData['fields'][row.field_name].display_name"
						/>
						<span v-else>{{ formData["fields"][row.field_name].display_name }}</span>
					</template>
				</ElTableColumn>
				<ElTableColumn
					prop="display"
					label="是否展示"
					align="center"
				>
					<template #default="{ row }">
						<ElCheckbox
							v-model="formData['fields'][row.field_name].display"
							:disabled="disabled"
						/>
					</template>
				</ElTableColumn>
				<ElTableColumn
					prop="searchable"
					label="可检索"
					align="center"
				>
					<template #default="{ row }">
						<ElCheckbox
							v-model="formData['fields'][row.field_name].searchable"
							:disabled="disabled || !formData['fields'][row.field_name].display"
						/>
					</template>
				</ElTableColumn>
				<ElTableColumn
					prop="editable"
					label="可修改"
					align="center"
				>
					<template #default="{ row }">
						<ElCheckbox
							v-model="formData['fields'][row.field_name].editable"
							:disabled="disabled || /((.*_id)|.*(user|time))$/.test(row.field_name)"
						/>
					</template>
				</ElTableColumn>
				<ElTableColumn
					prop="editable_when_add"
					label="添加时可自定义"
					align="center"
				>
					<template #default="{ row }">
						<ElCheckbox
							v-model="formData['fields'][row.field_name].editable_when_add"
							:disabled="disabled || /((add|update)_(uid|user|time))$/.test(row.field_name)"
						/>
					</template>
				</ElTableColumn>
			</ElTable>
		</template>
	</EditTemplate>
</template>

<style scoped lang="css">
	.edit-template :deep(.icon-movehandler) {
		cursor: move;
	}

	.edit-template.details :deep(.el-table__cell) {
		padding: 2px 0;
	}

	.edit-template :deep(tr) {
		background-color: white;
	}
	.edit-template :deep(tr.dragging) {
		background-color: #efefef;
	}
</style>
