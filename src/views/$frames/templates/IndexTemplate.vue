<!-- @format -->

<script setup lang="ts">
	import type { IDialogProps } from "@/common";
	import type { Result } from "@/common/utils/Result";
	import type { ILoading } from "@/common/utils/Interactive";
	import type { ComponentPublicInstance, VNodeRef } from "vue";
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

	import KButton from "@/components/KButton.vue";
	import IconFont from "@/components/IconFont.vue";
	import EditTemplate from "@/views/$frames/templates/EditTemplate.vue";
	import OperationBar from "@/views/$frames/templates/OperationBar.vue";
	import { ElDialog, ElTable, ElTableColumn, ElLoading } from "element-plus";
	import IndexedPagination from "@/components/Paginations/IndexedPagination.vue";

	import { useRouter } from "vue-router";
	import { EmptyObject } from "@/common/utils";
	import { detailButton, TemplateUtils } from ".";
	import { ObjectUtils } from "@/common/utils/Object";
	import { adminRequest } from "@/common/utils/Network";
	import { error, confirm, success, info } from "@/common/utils/Interactive";
	import { ICommonPaginationModelValue, IPaginationExposes, Paginations } from "@/components/Paginations";
	import { ref, onBeforeMount, reactive, provide, watch, inject, getCurrentInstance, markRaw, proxyRefs } from "vue";

	const props = defineProps<IndexTemplateProps>();
	const router = useRouter();

	const pageLoading = props.loading ?? inject<ILoading>("pageLoading")!;
	const indexTemplateIns = new Proxy(getCurrentInstance()!, {
		get(target, p) {
			let des = target.proxy as any;
			return des[p] ? des[p] : (target.exposeProxy ?? (proxyRefs(markRaw(target.exposed!)) as any))[p];
		},
	}) as any as IndexTemplateInsType;

	const pageProps = ref<IIndexPageProps>();
	const pageData = ref<Array<KeyStringObject>>();

	const templateRootEle = ref<HTMLDivElement>(EmptyObject);
	const tableIns = ref<InstanceType<typeof ElTable>>(EmptyObject);
	const operbar = ref<InstanceType<typeof OperationBar>>(EmptyObject);
	const pagination = ref<ComponentPublicInstance<IPaginationExposes>>();

	const pageQuery = reactive<ICommonPaginationModelValue>({} as any);
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

	var initPageData = new Array<KeyStringObject>();

	var loading: Optional<ReturnType<typeof ElLoading.service>>;

	onBeforeMount(updateTemplate);

	watch(
		() => props.url + "☆" + JSON.stringify(props.query),
		async (newV, old) => {
			// page is not prepared
			if (!pageProps.value) {
				return;
			}

			const [oldPath, oldSearch] = (old ?? "").split("☆", 2);
			const [newPath, newSearch] = (newV ?? "").split("☆", 2);
			if (oldPath != newPath) {
				updateTemplate();
			} else if (oldSearch != newSearch) {
				await refreshData();
			}
		}
	);
	watch(
		() => modalDialogProps.loading.value,
		(newVal) => {
			if (newVal) {
				loading = ElLoading.service({
					target: templateRootEle.value.querySelector(":scope > .el-overlay .el-dialog__body") as HTMLElement,
					text: "处理中...",
				});
			} else if (loading) {
				loading.close();
				loading = void 0;
			}
		}
	);
	watch(
		() => modalDialogProps.loading.tip,
		(newVal) => loading?.setText(newVal ?? "处理中...")
	);

	defineExpose({
		pageQuery,
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
		if (button.type === "search" && !pageQuery.searchField) {
			error("msg", { message: "请选择查询字段!" });
			return true;
		}

		if (props.onOperbarButtonClick?.(button, pageProps.value!.operbarButtons, modalDialogProps)) {
			if (modalDialogProps.show && !modalDialogProps.operLabel) {
				modalDialogProps.operLabel = button.title;
			}
			return true;
		}

		switch (button.type) {
			case "search": {
				if (props.localSearch === true) {
					TemplateUtils.searchByField(pageData.value as any, indexTemplateIns);
					break;
				}
				pageQuery.ts = new Date().getTime();
				onChangePage(pageQuery);
				break;
			}
			case "refresh":
				refreshData();
				break;
			case "add":
				operColumnButtonClick(button, null, pageProps.value!.operbarButtons);
				break;
			case "delete":
			case "bulkdelete":
				if (props.noSelectionColumn) {
					info("msg", { message: "当前操作不被支持！" });
					break;
				}
				const rows = getSelectedRows();
				if (rows.length === 0) {
					error("msg", { message: "请选择要删除的数据!" });
					return true;
				}
				operColumnButtonClick(button, rows.length === 1 ? rows[0] : rows, pageProps.value!.operbarButtons);
				break;
			default: {
				info("msg", { message: "当前操作不被支持！" });
				break;
			}
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
				if (window.getSelection()?.containsNode(templateRootEle.value, true)) {
					window.getSelection()!.removeAllRanges();
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
								if (result.msg?.includes("404")) {
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

								const initIdx = initPageData.indexOf(param!);
								initPageData.remove(initIdx);
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

	const paginationRefCallback: VNodeRef = function (instance) {
		const typedIns = instance as unknown as ComponentPublicInstance<IPaginationExposes>;
		if (pagination.value !== typedIns) {
			pagination.value = typedIns;
		}
	};

	provide("onUpdatedData", onUpdatedData);

	async function refreshData(init?: boolean) {
		ObjectUtils.reset(pageQuery, props.query, true);
		props.onQueryChanged?.(pageQuery);

		let query: Record<string, any> | undefined;
		if (props.url === router.currentRoute.value.path) {
			if (Object.keys(props.query).some((item) => !pageQuery.hasOwnProperty(item))) {
				ObjectUtils.reset(pageQuery, props.query, true);
				pageQuery.ts = new Date().getTime();
				query = Object.fromEntries(new URLSearchParams(pageQuery).entries());
				router.replace({ query });
			}
		}

		if (!query) {
			query = Object.fromEntries(new URLSearchParams(pageQuery).entries());
		}

		if (typeof pageQuery.pageSize === "number") {
			pageQuery.pageSize = Math.max(pageQuery.pageSize, Paginations.defaultPageSize);
		} else if (typeof pageQuery.pageSize === "string") {
			const pageSize = parseInt(pageQuery.pageSize);
			pageQuery.pageSize = isNaN(pageSize) ? Paginations.defaultPageSize : Math.max(pageSize, Paginations.defaultPageSize);
		}

		const configs: Parameters<RefreshCallback>[0] = {
			method: "GET",
			url: props.url,
			params: query,
			extraOptions: {
				loading: pageLoading,
				alwaysShowFeedbackMsg: false,
			},
		};

		if (init) {
			configs.params["initPageSize"] = Paginations.defaultPageSize;
		}

		if (pagination.value) {
			props.onRefreshData?.(configs);
		}

		const result = await adminRequest(configs);
		if (init) {
			return result;
		}

		if (result.success) {
			success("msg", { message: "已加载数据!" });
			const data = result.data as IPageData;
			pageData.value = data.data;
			initPageData = [...data.data];
			props.onDataRefreshed?.(pageData.value!);
			if (pagination.value) {
				pagination.value.refresh(data);
			}
		} else {
			pageData.value?.clear();
			error("msg", { message: `请求失败！${result.msg ?? ""}` });
		}

		return result.success;
	}

	async function updateTemplate() {
		pageData.value = undefined;
		pageProps.value = undefined;

		let info = props.modelValue;
		if (!info) {
			const result = (await refreshData(true)) as Result;
			if (!result.success) {
				error("alert", {
					title: "错误!",
					content: `请求失败!原因:${result.msg}`,
				});
				return;
			}

			info = result.data;
		}

		const tempPageProps: IIndexPageProps = {
			info: info!,
			allFields: {},
			displayFields: {},
			searchableFields: {},
			operColumnButtons: {},
			operbarButtons: {
				refresh: { icon: "refresh", oper_type: 1, title: "刷新", type: "refresh" },
			},
		};

		if (typeof tempPageProps.info.fieldsConfig === "string") {
			const fieldsConfig = await TemplateUtils.resolveFieldConfigs(tempPageProps.info.fieldsConfig);
			tempPageProps.info.fieldsConfig = fieldsConfig;
		}

		tempPageProps.info.fields.forEach((field) => {
			const fieldName = field.field_name;
			field.config = tempPageProps.info.fieldsConfig[fieldName] ?? {};

			tempPageProps.allFields[fieldName] = field;
			if (field.display) {
				tempPageProps.displayFields[fieldName] = field;
				if (field.searchable) {
					tempPageProps.searchableFields[fieldName] = field;
				}
			}
		});

		for (let idx = 0; idx < tempPageProps.info.operButtons?.length; idx++) {
			const item = tempPageProps.info.operButtons[idx];
			if (!item.oper_type) {
				continue;
			}

			if (item.oper_type & 0x1) {
				tempPageProps.operbarButtons[item.type] = item;
			}

			if ((item.oper_type & 0x2) !== 0) {
				tempPageProps.operColumnButtons[item.type] = item;
			}
		}
		await callTemplateBack(props.onPageInfoHandled, tempPageProps);

		pageProps.value = tempPageProps;
		pageData.value = tempPageProps.info.pageData.data;
		initPageData = [...tempPageProps.info.pageData.data];

		await callTemplateBack(props.onDataRefreshed, pageData.value);

		if (info?.pageData && pagination.value) {
			pagination.value.refresh(info.pageData);
		}
		return true;
	}

	function getSelectedRows() {
		return tableIns.value.getSelectionRows() as (KeyStringObject & { id: string | number })[];
	}

	function onChangePage(param: ICommonPaginationModelValue) {
		Object.assign(pageQuery, param);
		const query = Object.fromEntries(new URLSearchParams(pageQuery).entries());
		if (props.url == router.currentRoute.value.path) {
			router.push({ query });
		} else {
			Object.assign(props.query, query);
		}
		return false;
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

		await prop.call(undefined, ...args);
	}

	function getTableRowElements(): Array<HTMLTableRowElement> {
		return Array.from(templateRootEle.value.querySelectorAll(".data .table .el-table__row"));
	}

	function onSortChange(data: { column: any; prop: string; order: any }) {
		if (!data.prop || !pageData.value?.length) {
			return;
		}

		if (data.order === null) {
			pageData.value = initPageData;
			return;
		}

		const field = data.prop;
		const isAscending = data.order === "ascending";
		const partitionedEmptyDataMap = pageData.value.partitionBy(data.prop, (item) => item === null || item === undefined);

		const nonEmptyData = partitionedEmptyDataMap.get(false) ?? [];
		nonEmptyData.sort(isAscending ? (l, r) => l[field] - r[field] : (l, r) => r[field] - l[field]);

		const emptyData = partitionedEmptyDataMap.get(true) ?? [];
		nonEmptyData.unshift(...emptyData);

		pageData.value = nonEmptyData;
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
				v-model="pageQuery"
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
						table-layout="auto"
						empty-text="未查询到数据"
						:data="pageData"
						v-bind="tableProps"
						@sort-change="onSortChange"
						@row-dblclick="(row: Object) => operColumnButtonClick(detailButton, row, null as any)"
					>
						<ElTableColumn
							v-if="noSelectionColumn !== true"
							type="selection"
							align="center"
							v-bind="selectionColumnProps"
						/>
						<ElTableColumn
							v-if="showIndexColumn"
							sortable
							fixed="left"
							label="序号"
							type="index"
							align="center"
						/>
						<slot name="layouts">
							<template v-for="field in Object.values(pageProps.displayFields).sort((l, r) => l.display_order - r.display_order)">
								<ElTableColumn
									align="center"
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
							>
								<template #default="{ row, $index }">
									<slot
										name="opers"
										:data="row"
										:buttons="pageProps.operColumnButtons"
										:clickHandler="operColumnButtonClick"
									>
										<template v-for="button in pageProps.operColumnButtons">
											<template v-if="!button.condition || button.condition(row, $index)">
												<IconFont
													v-if="button.icon"
													:value="button.icon"
													:class="button.icon"
													:title="button.title"
													@click="operColumnButtonClick(button, row, null as any)"
												/>
												<KButton
													v-else
													:class="button.icon"
													@click="operColumnButtonClick(button, row, null as any)"
													>{{ button.title }}
												</KButton>
											</template>
										</template>
									</slot>
								</template>
							</ElTableColumn>
						</slot>
					</ElTable>
				</div>
				<slot
					name="pagination"
					v-bind="{ pageQuery, references: paginationRefCallback, onChange: onChangePage }"
				>
					<IndexedPagination
						v-if="noPagination !== true && pageData"
						ref="pagination"
						:model-value="pageQuery"
						:max-page-amount="7"
						:page-sizes="[20, 40, 100, 200]"
						@change="onChangePage"
					/>
				</slot>
			</div>
			<ElDialog
				draggable
				destroy-on-close
				v-model="modalDialogProps.show"
				:align-center="true"
				:close-on-click-modal="false"
				:width="modalDialogProps.width"
				:before-close="onDialogBeforeClose"
				:title="`${head}-${modalDialogProps.operLabel}`"
				@closed="onDialogClosed"
			>
				<div
					class="wrapper"
					v-if="modalDialogProps.show"
				>
					<!-- all dialog content slot, if defined, all modes' dialog will use defined slot to render -->
					<slot
						v-if="$slots['dialogContent']"
						name="dialogContent"
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
					<!-- `edit`, `add`, `details` slot, if not defined, use default template to render -->
					<template v-else-if="['edit', 'add', 'details'].includes(modalDialogProps.mode)">
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
						></slot>
						<EditTemplate
							v-else
							:mode="modalDialogProps.mode"
							:raw-data="modalDialogProps.data"
							:fields="pageProps.allFields"
							:title="modalDialogProps.operLabel"
							:modal-dialog-props="modalDialogProps"
							@updated-data="onUpdatedData"
							@prepared="onEditTemplatePrepared"
						/>
					</template>
					<!-- other common slot, modes except `edit`, `add`, `details` will use this slot to render-->
					<slot
						v-else
						name="commonContent"
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
		width: 100%;
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
		font-weight: bold;
		color: black;
	}
	.el-table :deep(.oper-column .cell) {
		text-align: left;
	}
	.el-table :deep(.oper-column .iconfont),
	.el-table :deep(.oper-column .ui-button) {
		padding: 0;
		cursor: pointer;
		background-color: transparent;
		color: var(--el-color-primary);
	}
	.el-table :deep(.oper-column .ui-button),
	.el-table :deep(.oper-column .iconfont) {
		margin: 0 0.3em;
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
