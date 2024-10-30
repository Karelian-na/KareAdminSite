<!-- @format -->

<script setup lang="ts">
	import type { ILoading } from "@/common/utils/Interactive";
	import type {
		OperbarButtonClickHandler,
		PreparedCallback,
		HandleEditTemplateProps,
		PageInfoHandler,
		OperColumnButtonClickHandler,
		IndexTemplateProps,
	} from "@/views/templates";

	import AssignRole from "./Assign.vue";
	import AoTag from "@/components/AoTag.vue";
	import Authorize from "@/views/menus/Authorize.vue";
	import { ElAvatar, ElRow, TableProps } from "element-plus";
	import IndexTemplate from "@/views/templates/IndexTemplate.vue";

	import { inject, ref } from "vue";
	import { KasConfig } from "@/configs";
	import { EmptyObject } from "@/common/utils";
	import { TemplateUtils } from "@/views/templates";
	import { ObjectUtils } from "@/common/utils/Object";
	import { adminRequest } from "@/common/utils/Network";
	import { confirm, error } from "@/common/utils/Interactive";

	const pageLoading = inject<ILoading>("pageLoading")!;

	const props = defineProps<IndexTemplateProps>();

	const userMode = props.url.includes("users");

	const indexTemplateIns = ref<InstanceType<typeof IndexTemplate>>(EmptyObject);

	const tableProps: Partial<TableProps<any>> = {
		defaultSort: { prop: "level", order: "ascending" },
	};

	const pageInfoAccepted: PageInfoHandler = function (pageProps) {
		if (userMode) {
			pageProps.allFields["avatar"].config!.itemBindProps = undefined;
		} else {
			["edit", "delete"].forEach((field) => {
				if (!pageProps.operColumnButtons[field]) {
					return;
				}

				pageProps.operColumnButtons[field].condition = (data) => {
					return ![KasConfig.adminRole, KasConfig.commonUserRole].includes(data["id"]);
				};
			});

			if (pageProps.operColumnButtons["authorize"]) {
				pageProps.operColumnButtons["authorize"].condition = (data) => {
					return ![KasConfig.commonUserRole].includes(data["id"]);
				};
			}
		}
	};

	const onOperbarButtonClick: OperbarButtonClickHandler = function (button, buttons, modalDialogProps) {
		switch (button.type) {
			case "reset": {
				// normal user mode
				const selectedRows = indexTemplateIns.value.getSelectedRows();
				if (selectedRows.length === 0) {
					error("msg", { message: "请先选择数据!" });
					break;
				}
				const ids = selectedRows.map((value) => value.id);
				confirm("确定要重置所选用户的密码吗? 重置后密码为: 123456", {
					callback: (action, _ins) => {
						if (action != "confirm") return;

						adminRequest({
							method: "PUT",
							url: `/users/reset`,
							data: ids,
							extraOptions: {
								loading: pageLoading,
							},
						});
					},
				});
				return true;
			}
			case "assign": {
				// normal user mode
				const selectedRows = indexTemplateIns.value.getSelectedRows();
				if (selectedRows.length === 0) {
					error("msg", { message: "请先选择数据!" });
					break;
				}
				indexTemplateIns.value.modalDialogProps.show = true;
				indexTemplateIns.value.modalDialogProps.mode = "assign";
				indexTemplateIns.value.modalDialogProps.data = selectedRows;
				indexTemplateIns.value.modalDialogProps.action = button.action;
				return true;
			}
			case "restore": {
				// deleted user mode
				const selectedRows = indexTemplateIns.value.getSelectedRows();
				if (selectedRows.length === 0) {
					error("msg", { message: "请先选择数据!" });
					break;
				}
				const ids = selectedRows.map((value) => value.id);
				return onOperColumnButtonClick(button, ids as any, buttons, modalDialogProps);
			}
			default:
				return false;
		}
		return true;
	};

	const onOperColumnButtonClick: OperColumnButtonClickHandler = function (button, param, _, modalDialogProps) {
		switch (button.type) {
			case "restore": {
				modalDialogProps!.show = false;

				const ids = Array.isArray(param) ? param : [(param as any).id];
				const msg = "确定要恢复" + (Array.isArray(param) ? "选中的" : "该") + "删除的用户吗?";
				confirm(msg, {
					callback: async (action, _ins) => {
						if (action != "confirm") return;

						const result = await adminRequest({
							method: "PUT",
							url: button.action,
							data: ids,
							extraOptions: {
								loading: pageLoading,
							},
						});

						if (!result.success) {
							return;
						}

						indexTemplateIns.value.refreshData();
					},
				});
				return true;
			}
			case "delete": {
				// deleted user mode
				if (!userMode || !props.url.includes("/deleted")) {
					return false;
				}

				return {
					tip:
						"确定要永久删除" +
						(Array.isArray(param) ? "所选中的" : "该") +
						"用户吗？\n" +
						"该操作非常危险，并且不可逆！\n" +
						"该将删除所有与用户关联的数据，所有由用户添加的数据将丢失关联！",
					extraMsgBoxOptions: {
						customStyle: {
							whiteSpace: "pre-wrap",
						},
					},
				};
			}
			default:
				break;
		}
		return false;
	};

	const onEditTemplatePrepared: PreparedCallback = function (formData, fields, mode) {
		if (!userMode) {
			if (mode === "edit" && formData["id"] <= 2) {
				fields["level"].editable = false;
			} else if (mode !== "details") {
				fields["level"].editable = true;
			}
		}
	};

	const handleEditTemplateProps: HandleEditTemplateProps = function (attrs) {
		if (attrs.mode === "assign") {
			attrs.title = "修改";
			attrs.mode = "assign";

			attrs.fields = { roles: ObjectUtils.clone(attrs.fields["roles"]) };
			attrs.fields["roles"].editable = true;
			ObjectUtils.mergeAttributes(attrs.fields["roles"].config, "itemBindProps", {
				labelWidth: "0",
				label: "",
			});
			attrs.modalDialogProps!.width = "auto";
		}
		return attrs;
	};
</script>
<template>
	<IndexTemplate
		v-bind="props"
		ref="indexTemplateIns"
		:table-props="tableProps"
		@page-info-handled="pageInfoAccepted"
		@operbar-button-click="onOperbarButtonClick"
		@oper-column-button-click="onOperColumnButtonClick"
		@edit-template-prepared="onEditTemplatePrepared"
	>
		<template
			v-if="userMode"
			#name="{ data }"
		>
			<ElRow class="name">
				<ElAvatar
					:size="50"
					:src="data['avatar']"
				/>
				<div class="msg">
					<p>{{ data["id"] }}</p>
					<p>{{ data["name"] }}</p>
				</div>
			</ElRow>
		</template>

		<template
			v-if="userMode"
			#delete_type="{ value, field }"
		>
			<AoTag
				class="delete"
				:label="String(TemplateUtils.mapDataValueToLabel(field, value))"
			/>
		</template>

		<template #dialogContent="attrs">
			<Authorize
				v-if="attrs.mode == 'authorize'"
				:kind="userMode ? 'user' : 'role'"
				v-bind="handleEditTemplateProps(attrs)"
			/>
			<AssignRole
				v-if="attrs.mode == 'assign'"
				v-bind="handleEditTemplateProps(attrs)"
			/>
		</template>
	</IndexTemplate>
</template>

<style scoped lang="css">
	.el-row.name {
		flex-wrap: nowrap;
		flex-shrink: 0;
		width: fit-content;
		justify-content: center;
	}
	.el-row.name .el-avatar {
		flex-shrink: 0;
	}
	.el-row.name .msg {
		text-align: left;
		margin-left: 1em;
		height: 50px;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	.index-template :deep(.edit-item .upload-item) {
		width: 100px;
		height: 100px;
	}
	.index-template :deep(.edit-item .el-upload) {
		border-radius: 50%;
	}

	.ao-tag.delete {
		background-color: brown;
	}
</style>
