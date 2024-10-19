<!-- @format -->

<script setup lang="ts">
	import type { IDialogProps } from "@/common";
	import type { Result } from "@/common/utils/Result";
	import type { ILoading } from "@/common/utils/Interactive";
	import type { Arrayable, KeyStringObject, Optional } from "@/common/utils";
	import type {
		DataChangedCallback,
		IIndexPageProps,
		IPageData,
		IndexTemplateInsType,
		IndexTemplateProps,
		OperColumnButtonClickHandler,
		OperbarButtonClickHandler,
		RefreshCallback,
	} from ".";

	import AoButton from "@/components/AoButton.vue";
	import IconFont from "@/components/IconFont.vue";
	import Pagination from "@/components/Pagination.vue";
	import EditTemplate from "@/views/templates/EditTemplate.vue";
	import OperationBar from "@/views/templates/OperationBar.vue";
	import { ElDialog, ElTable, ElTableColumn, ElLoading } from "element-plus";

	import { useRouter } from "vue-router";
	import { EmptyObject } from "@/common/utils";
	import { detailButton, TemplateUtils } from ".";
	import { adminRequest } from "@/common/utils/Network";
	import { error, confirm, success, info } from "@/common/utils/Interactive";
	import { ref, onBeforeMount, reactive, provide, nextTick, onActivated, watch, inject, getCurrentInstance, markRaw, proxyRefs } from "vue";

	const props = defineProps<IndexTemplateProps>();
	const router = useRouter();

	const pageLoading = props.loading ?? inject<ILoading>("pageLoading")!;
	const indexTemplateIns = new Proxy(getCurrentInstance()!, {
		get(target, p) {
			let des = target.proxy as any;
			return des[p] ? des[p] : (target.exposeProxy ?? (proxyRefs(markRaw(target.exposed!)) as any))[p];
		},
	}) as any as IndexTemplateInsType;

	const operColumnWidth = ref(0);
	const pageData = ref<Array<KeyStringObject>>();
	const pageProps = ref<IIndexPageProps>();
	const templateRootEle = ref<HTMLDivElement>(EmptyObject);
	const pagination = ref<InstanceType<typeof Pagination>>();
	const tableIns = ref<InstanceType<typeof ElTable>>(EmptyObject);
	const operbar = ref<InstanceType<typeof OperationBar>>(EmptyObject);
	const pageValue = reactive({
		pageIdx: 1,
		pageSize: 20,
		dataCount: 0,
	});
	const modalDialogProps = reactive<IDialogProps>({
		show: false,
		mode: "",
		operLabel: "",
		data: {},
		loading: {
			value: false,
			tip: "加载中...",
		},
	});

	var loading: ReturnType<typeof ElLoading.service>;

	onBeforeMount(updateTemplate);
	onActivated(onPageChanged);

	watch(() => props.url, updateTemplate);
	watch(() => JSON.stringify(props.query), refreshData.bind(undefined, undefined));
	watch(
		() => modalDialogProps.loading.value,
		(newVal) => {
			if (!loading) {
				loading = ElLoading.service({
					target: templateRootEle.value.querySelector(":scope > .el-overlay .el-dialog__body") as HTMLElement,
					text: "加载中...",
					visible: modalDialogProps.loading.value,
				});
			} else {
				loading.setText("处理中...");
			}
			loading.visible.value = newVal;
		}
	);
	watch(
		() => modalDialogProps.loading.tip,
		(newVal) => loading?.setText(newVal ?? "处理中...")
	);

	defineExpose({
		operbar,
		modalDialogProps,
		getSelectedRows,
		refreshData,
		tableIns,
		pageProps,
		pageData,
		getTableRowElements,
	});

	const onUpdatedData: DataChangedCallback = function (action, data) {
		if (props.onDataChanged?.(action, data, pageData.value)) {
			return true;
		}

		switch (action) {
			case "add":
				pageData.value!.push(data);
				break;
			case "edit": {
				if (modalDialogProps.data.length > 1) {
					refreshData();
					return true;
				}
				delete data["ids"];

				Object.assign(modalDialogProps.data, data);
			}
			default:
				break;
		}
		return true;
	};

	const operbarButtonClick: OperbarButtonClickHandler = function (button) {
		if (button.type === "search" && operbar.value.searchField == "") {
			error("msg", { message: "请选择查询字段!" });
			return true;
		}

		if (props.onOperbarButtonClick?.(button, pageProps.value!.operbarButtons, modalDialogProps)) {
			return true;
		}

		switch (button.type) {
			case "search": {
				if (props.localSearch === true) {
					TemplateUtils.searchByField(pageData.value as any, indexTemplateIns);
					break;
				}
			}
			case "refresh":
				refreshData();
				break;
			case "add":
				operColumnButtonClick(button, null, pageProps.value!.operbarButtons);
				break;
			case "delete":
			case "bulkdelete":
				const rows = getSelectedRows();
				if (rows.length === 0) {
					error("msg", { message: "请选择要删除的数据!" });
					return true;
				}
				operColumnButtonClick(button, rows.length === 1 ? rows[0] : rows, pageProps.value!.operbarButtons);
				break;
			default:
				break;
		}
		return true;
	};

	const operColumnButtonClick: OperColumnButtonClickHandler = function (button, param) {
		switch (button.type) {
			case "edit":
				modalDialogProps.operLabel = "修改";
				break;
			case "details":
				if (!Object.values(pageProps.value!.allFields).some((item) => item.config.layoutSpan)) {
					return true;
				}
			default:
				modalDialogProps.operLabel = button.title;
				break;
		}

		modalDialogProps.show = true;
		modalDialogProps.mode = button.type;
		modalDialogProps.data = param!;
		modalDialogProps.action = button.action;

		let operAttrs = props.onOperColumnButtonClick?.(button, param, pageProps.value!.operColumnButtons, modalDialogProps);
		if (operAttrs === true) {
			return true;
		} else if (button.type !== "details" && !button.action) {
			modalDialogProps.show = false;
			info("msg", { message: "当前操作不被支持！" });
			return true;
		}

		if (!operAttrs) {
			operAttrs = {};
		}

		switch (button.type) {
			case "add":
				break;
			case "delete":
			case "bulkdelete": {
				modalDialogProps.show = false;
				!operAttrs.action && (operAttrs.action = button.action);

				if (Array.isArray(param)) {
					if (!operAttrs.sendData) {
						operAttrs.sendData = { ids: param.map((item) => item.id).join(",") };
					}
					if (button.action?.endsWith("/delete")) {
						operAttrs.action = button.action.slice(0, -"/delete".length) + "/bulkdelete";
					}
					!operAttrs.tip && (operAttrs.tip = "确定要删除选中数据吗?");
				} else {
					if (!operAttrs.sendData) {
						operAttrs.sendData = { id: param!["id"] };
					}
					!operAttrs.tip && (operAttrs.tip = "确定要删除该条数据吗?");
				}

				!operAttrs.extraMsgBoxOptions && (operAttrs.extraMsgBoxOptions = {});
				operAttrs.extraMsgBoxOptions.callback = (action, _ins) => {
					if (action != "confirm") return;

					adminRequest({
						method: "DELETE",
						url: operAttrs.action,
						params: operAttrs.sendData,
						extraOptions: {
							loading: pageLoading,
						},
						callback: (result) => {
							if (!result.success) {
								if (result.msg.includes("404")) {
									error("msg", { message: "操作失败！后台不支持批量删除！" });
									return true;
								}
								return false;
							}

							if (props.onDataChanged?.("delete", param!, pageData.value)) {
								return false;
							}

							if (Array.isArray(param)) {
								refreshData();
							} else {
								const idx = pageData.value!.indexOf(param!);
								idx != -1 && pageData.value!.remove(idx);
							}

							return false;
						},
					});
				};
				confirm(operAttrs.tip, operAttrs.extraMsgBoxOptions);
				break;
			}
			default:
				break;
		}
		return true;
	};

	provide("onUpdatedData", onUpdatedData);

	async function refreshData(initIndexUrl?: string) {
		pageValue.pageIdx = props.query?.pageIdx ?? 1;
		pageValue.pageSize = props.query?.pageSize ?? 20;

		const configs: Parameters<RefreshCallback>[0] = {
			method: "GET",
			url: initIndexUrl ?? pageProps.value!.indexUrl,
			params:
				pagination.value || initIndexUrl
					? {
							pageIdx: pageValue.pageIdx,
							pageSize: pageValue.pageSize,
							searchKey: operbar.value.searchKey,
							searchField: operbar.value.searchField,
					  }
					: {},
			extraOptions: {
				loading: pageLoading,
				alwaysShowFeedbackMsg: false,
			},
		};

		if (initIndexUrl) {
			configs.params["initPageSize"] = pageValue.pageSize;
		}

		if (pagination.value) {
			props.onRefreshData?.(configs);
		}

		const result = await adminRequest(configs);
		if (initIndexUrl) {
			return result;
		}

		if (result.success) {
			success("msg", { message: "已加载数据!" });
			const data = result.data as IPageData;
			pageData.value = data.data;
			pageValue.pageIdx = data.curPageIdx;
			pageValue.dataCount = data.totalCount;
			props.onDataRefreshed?.(pageData.value!);
		} else {
			error("msg", { message: `请求失败！${result.msg}` });
		}

		if (pagination.value) {
			pagination.value.refresh();
		}

		return result.success;
	}

	async function updateTemplate() {
		operColumnWidth.value = 0;

		pageData.value = undefined;
		pageProps.value = undefined;

		const tempPageProps: IIndexPageProps = {} as any;

		// 保存当前页面的所有页地址与父地址
		if (props.url.endsWith("/")) {
			tempPageProps.indexUrl = props.url + "index";
			tempPageProps.parentUrl = props.url;
		} else {
			tempPageProps.indexUrl = props.url;
			tempPageProps.parentUrl = props.url.substring(0, props.url.lastIndexOf("/") + 1);
		}

		const result = (await refreshData(tempPageProps.indexUrl)) as Result;
		if (!result.success) {
			error("alert", {
				title: "错误!",
				content: `请求失败!原因:${result.msg}`,
			});
			return;
		}

		tempPageProps.info = result.data;
		tempPageProps.allFields = {};
		tempPageProps.displayFields = {};
		tempPageProps.searchableFields = {};
		tempPageProps.operColumnButtons = {};
		tempPageProps.operbarButtons = {
			refresh: { icon: "refresh", oper_type: 1, title: "刷新", type: "refresh" },
		};

		const fieldsConfig = await TemplateUtils.resolveFieldConfigs(tempPageProps.info.fieldsConfig);

		tempPageProps.info.fields.forEach((field) => {
			const fieldName = field.field_name;
			field.config = fieldsConfig[fieldName] ?? {};

			tempPageProps.allFields[fieldName] = field;
			if (field.display) {
				tempPageProps.displayFields[fieldName] = field;
				if (field.searchable) {
					tempPageProps.searchableFields[fieldName] = field;
				}
			}
		});
		let operButtonCount = 0;
		const fontSize = 14;
		// padding
		operColumnWidth.value += 36;
		for (let idx = 0; idx < tempPageProps.info.operButtons.length; idx++) {
			const item = tempPageProps.info.operButtons[idx];
			if (!item.oper_type) {
				continue;
			}

			if (item.action) {
				item.type = item.action.substring(item.action.lastIndexOf("/") + 1);
			}

			if (item.oper_type & 0x1) {
				tempPageProps.operbarButtons[item.type] = item;
			}

			if ((item.oper_type & 0x2) !== 0) {
				tempPageProps.operColumnButtons[item.type] = item;
				operColumnWidth.value += fontSize;
				// margin-left, not first child
				if (operButtonCount !== 0) {
					operColumnWidth.value += fontSize;
				}
				++operButtonCount;
			}
		}
		if (operColumnWidth.value < 36 + 2 * fontSize) {
			operColumnWidth.value = 36 + 2 * fontSize;
		}

		await callTemplateBack(props.onPageInfoHandled, tempPageProps);

		pageProps.value = tempPageProps;
		pageData.value = tempPageProps.info.pageData.data;
		pageValue.pageIdx = tempPageProps.info.pageData.curPageIdx;
		pageValue.dataCount = tempPageProps.info.pageData.totalCount;
		await callTemplateBack(props.onDataRefreshed, pageData.value);

		onPageChanged();
		return true;
	}

	function computeIndex(index: number) {
		if (pagination.value) {
			return (pageValue.pageIdx - 1) * pageValue.pageSize + index + 1;
		}
		return index + 1;
	}

	function getSelectedRows() {
		return tableIns.value.getSelectionRows() as (KeyStringObject & { id: string | number })[];
	}

	function onChangePage(pageIdx: number, pageSize: number) {
		router.push(`${props.url}?pageIdx=${pageIdx}&pageSize=${pageSize}`);
		return true;
	}

	async function onPageChanged() {
		await nextTick();

		if (pagination.value) {
			const wrapperElement = document.querySelector<HTMLDivElement>(".content .wrapper")!;
			if (pagination.value.pageAmount > 1) {
				const minWidth = pagination.value.$el.clientWidth + 40;
				wrapperElement.style.setProperty("min-width", `${minWidth < 720 ? 720 : minWidth}px`);
			} else {
				wrapperElement.style.removeProperty("min-width");
			}
		}
	}

	async function onDialogBeforeClose(done: (cancel?: boolean) => void) {
		const result = await modalDialogProps.askIfNeedToLeave?.({} as any, {} as any);
		if (result === false) {
			done(true);
			return;
		}

		done();
		if (result instanceof Function) {
			result();
		}
	}

	function onDialogClosed() {
		modalDialogProps.mode = "";
		modalDialogProps.data = {};
		modalDialogProps.operLabel = "";

		delete modalDialogProps.width;
		delete modalDialogProps.operAction;
	}

	async function callTemplateBack(prop: Optional<Arrayable<Function>>, ...args: Array<any>) {
		if (prop === undefined) {
			return;
		}

		if (Array.isArray(prop)) {
			for await (const item of prop) {
				item.call(undefined, ...args);
			}
			return;
		}

		prop.call(undefined, ...args);
	}

	function getTableRowElements(): Array<HTMLTableRowElement> {
		return Array.from(templateRootEle.value.querySelectorAll(".data .table .el-table__row"));
	}
</script>

<template>
	<div
		ref="templateRootEle"
		class="index-template"
	>
		<template v-if="pageProps">
			<OperationBar
				ref="operbar"
				:default-search-field="defaultSearchField"
				:oper-buttons="pageProps.operbarButtons"
				:searchable-fields="pageProps.searchableFields"
				@operbar-button-click="operbarButtonClick"
			>
				<template
					v-if="$slots['operbar']"
					#default="operbarProps"
				>
					<slot
						name="operbar"
						v-bind="operbarProps"
					>
					</slot>
				</template>
			</OperationBar>
			<div class="data">
				<div class="table">
					<ElTable
						v-if="pageData"
						border
						stripe
						ref="tableIns"
						height="100%"
						table-layout="fixed"
						empty-text="未查询到数据"
						:data="pageData"
						v-bind="tableProps"
						@row-dblclick="(row: Object) => operColumnButtonClick(detailButton, row, null as any)"
					>
						<ElTableColumn
							v-if="noSelectionColumn !== true"
							type="selection"
							align="center"
							width="39px"
						/>
						<ElTableColumn
							v-if="showIndexColumn"
							sortable
							fixed="left"
							label="序号"
							type="index"
							align="center"
							width="60px"
							:index="computeIndex"
						/>
						<slot name="layouts">
							<template v-for="field in Object.values(pageProps.displayFields).sort((l, r) => l.display_order - r.display_order)">
								<ElTableColumn
									align="center"
									show-overflow-tooltip
									:prop="field.field_name"
									:label="field.display_name"
									:class-name="field.field_name"
									v-bind="field.config.columnBindProps"
								>
									<template
										#default="{ row }"
										v-if="$slots[field.field_name]"
									>
										<slot
											:name="field.field_name"
											v-bind="{
												data: row as KeyStringObject, 
												field: field, 
												value: row[field.field_name],
												clickHandler: operColumnButtonClick 
											}"
										></slot>
									</template>
									<template
										v-else-if="['enum', 'radio', 'switch'].includes(field.config.type ?? '')"
										#default="{ row }"
										>{{ TemplateUtils.mapDataValueToLabel(field, row[field.field_name]) }}
									</template>
								</ElTableColumn>
							</template>
							<ElTableColumn
								v-if="Object.keys(pageProps.operColumnButtons).length || $slots['opers']"
								fixed="right"
								label="操作"
								prop="operation"
								align="center"
								style="white-space: nowrap"
								class-name="oper-column"
								:width="operColumnWidth"
							>
								<template #default="{ row }">
									<slot
										name="opers"
										:data="row"
										:buttons="pageProps.operColumnButtons"
										:clickHandler="operColumnButtonClick"
									>
										<template v-for="button in pageProps.operColumnButtons">
											<template v-if="!button.condition || button.condition(row)">
												<IconFont
													v-if="button.icon"
													:value="button.icon"
													:class="button.icon"
													:title="button.title"
													@click="operColumnButtonClick(button, row, null as any)"
												/>
												<AoButton
													v-else
													:class="button.icon"
													@click="operColumnButtonClick(button, row, null as any)"
													>{{ button.title }}
												</AoButton>
											</template>
										</template>
									</slot>
								</template>
							</ElTableColumn>
						</slot>
					</ElTable>
				</div>
				<Pagination
					v-if="noPagination !== true && pageData"
					ref="pagination"
					:model-value="pageValue"
					:max-page-amount="7"
					:page-sizes="[20, 40, 100, 200]"
					@change="onChangePage"
					@changed="onPageChanged"
				/>
			</div>
			<ElDialog
				draggable
				v-model="modalDialogProps.show"
				:align-center="true"
				:close-on-click-modal="false"
				:width="modalDialogProps.width"
				:before-close="onDialogBeforeClose"
				:title="`${head}-${modalDialogProps.operLabel}`"
				@closed="onDialogClosed"
			>
				<div class="wrapper">
					<slot
						v-if="$slots['editContent']"
						name="editContent"
						v-bind="{
							mode: modalDialogProps.mode,
							rawData: modalDialogProps.data,
							fields: pageProps.allFields,
							title: modalDialogProps.operLabel,
							modalDialogProps,
							onUpdatedData,
						}"
					>
					</slot>
					<template v-else>
						<EditTemplate
							v-if="['edit', 'add', 'details'].includes(modalDialogProps.mode)"
							:mode="modalDialogProps.mode"
							:raw-data="modalDialogProps.data"
							:fields="pageProps.allFields"
							:title="modalDialogProps.operLabel"
							:modal-dialog-props="modalDialogProps"
							@updated-data="onUpdatedData"
							@prepared="onEditTemplatePrepared"
						/>
					</template>
					<slot
						name="dialogContent"
						v-bind="{
							mode: modalDialogProps.mode,
							rawData: modalDialogProps.data,
							fields: pageProps.allFields,
							title: modalDialogProps.operLabel,
							modalDialogProps,
							onUpdatedData,
						}"
					></slot>
				</div>
			</ElDialog>
		</template>
	</div>
</template>

<style scoped lang="css">
	.index-template {
		/* Layout */
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		padding: 20px;
		padding-top: 0;
		box-sizing: border-box;
	}

	.index-template .data {
		flex-grow: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}
	.index-template :deep(.el-dialog) {
		max-height: 80%;
		display: flex;
		flex-direction: column;
		transition: all 0.3s cubic-bezier(0.075, 0.82, 0.165, 1);
	}

	.data > .table {
		flex-grow: 1;
		overflow: auto;
		color: black;
	}
	.data .ui-pagination {
		margin-top: 10px;
	}

	.el-table :deep(.el-table__cell) {
		line-height: 1;
	}
	.el-table :deep(.cell) {
		white-space: nowrap;
	}
	.el-table :deep(thead .cell) {
		text-align: center !important;
		font-weight: bold;
		color: black;
	}
	.el-table :deep(.oper-column .cell) {
		text-align: left;
		text-overflow: unset;
		padding: 0 18px;
	}
	.el-table :deep(.oper-column .ui-button) {
		padding: 0.4em;
		color: white;
	}
	.el-table :deep(.oper-column .iconfont) {
		cursor: pointer;
		color: var(--el-color-primary);
	}
	.el-table :deep(.oper-column .ui-button .iconfont) {
		color: inherit;
	}
	.el-table :deep(.oper-column .iconfont:not(:first-of-type)) {
		margin-left: 1em;
	}

	.index-template :deep(.el-dialog .el-dialog__header) {
		padding-bottom: 0;
	}
	.index-template :deep(.el-dialog .el-dialog__body) {
		flex-grow: 1;
		overflow: hidden;
		display: flex;
		padding: 0;
	}

	.index-template .wrapper {
		width: 100%;
		overflow: auto;
		padding-right: 1em;
	}
</style>
