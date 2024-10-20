/** @format */

import type { IDialogProps } from "@/common";
import type { AxiosRequestOption } from "@/common/utils/Network";
import type { ComputedRef, ExtractPropTypes, PropType, Ref } from "vue";
import type { AlertOptions, ILoading } from "@/common/utils/Interactive";
import type { Arrayable, KeyStringObject, Optional, Promisable } from "@/common/utils";
import type { ButtonInstance, ElTableColumn, FormItemInstance, FormRules, TableColumnInstance, TableInstance } from "element-plus";
import type IndexTemplate from "./IndexTemplate.vue";

import { error } from "@/common/utils/Interactive";

import ExcelJS from "exceljs";

/**
 * 字段属性
 * @export
 * @interface IField
 */
export interface IField {
	/**
	 * 字段名
	 * @type {string}
	 * @memberof IField
	 */
	field_name: string;

	/**
	 * 是否展示在列表页
	 * @type {boolean}
	 * @memberof IField
	 */
	display: boolean;

	/**
	 * 展示在列表页面时，表格列名
	 * @type {string}
	 * @memberof IField
	 */
	display_name: string;

	/**
	 * 在列表页面展示的顺序
	 * @type {number}
	 * @memberof IField
	 */
	display_order: number;

	/**
	 * 是否可检索
	 * @type {boolean}
	 * @memberof IField
	 */
	searchable: boolean;

	/**
	 * 控制在编辑对话框中是否可编辑
	 * @type {boolean}
	 * @memberof IField
	 */
	editable: boolean;

	/**
	 * 控制在添加对话框中是否可编辑
	 * @type {boolean}
	 * @memberof IField
	 */
	editable_when_add: boolean;

	/**
	 * 字段的配置
	 *
	 * @author Karelian_na
	 * @date 2024/09/23 18:38:48
	 */
	config: IFieldConfig;
}

/**
 * 字段集类型
 */
export type Fields = Record<string, IField>;

/**
 * 编辑、添加对话中决定字段是否显示的回调
 */
export type FieldShowCallback = (mode: string) => boolean;

/**
 * 始终不显示字段的回调
 */
export const UnShowField: FieldShowCallback = function () {
	return false;
};

/**
 * 在对话框模式为添加模式时，不显示字段，其余模式显示字段
 */
export const UnShowFieldWhenAdd: FieldShowCallback = function (mode) {
	return mode !== "add";
};

/**
 * @description 枚举类型的字段的枚举项
 * @author Karelian_na
 * @date 2023/09/14 09:19:27
 * @export
 * @interface IEnumItem
 */
export interface IEnumItem {
	/**
	 * @description 枚举项的取值
	 * @author Karelian_na
	 * @date 2023/09/14 09:19:54
	 * @type {(string | number | boolean)}
	 * @memberof IEnumItem
	 */
	value: string | number | boolean;

	/**
	 * @description 枚举项的显示值
	 * @author Karelian_na
	 * @date 2023/09/14 09:20:32
	 * @type {string}
	 * @memberof IEnumItem
	 */
	label: string;

	/**
	 * @description 是否可用
	 * @author Karelian_na
	 * @date 2023/09/14 09:20:43
	 * @type {(boolean | ComputedRef<boolean>)}
	 * @memberof IEnumItem
	 */
	disabled?: boolean | ComputedRef<boolean>;
	[props: string]: any;
}

/**
 * @description 字段配置接口
 * @author Karelian_na
 * @date 2023/09/14 09:17:34
 * @export
 * @interface IFieldConfig
 */
export interface IFieldConfig {
	index: number;

	/**
	 * @description 绑定到 EditItem 组件的额外属性，具体于指定类型对应的element组件的属性，例如当{@link EditItemType}="enum"时，为ElSelect
	 * @author Karelian_na
	 * @date 2023/09/08 20:21:02
	 * @type {*}
	 */
	bindProps?: any;

	/**
	 * @description 绑定到EditItem组件的额外属性，转发至ElFormItem
	 * @author Karelian_na
	 * @date 2023/09/13 17:07:43
	 * @type {Partial<FormItemInstance["$props"]>}
	 */
	itemBindProps?: Partial<FormItemInstance["$props"]>;

	/**
	 * @description 字段在编辑或详情框中所占的宽度大小，最大24即占满一行
	 * @author Karelian_na
	 * @date 2023/09/08 20:19:09
	 * @type {number}
	 */
	layoutSpan: number;

	/**
	 * @description 当前字段的类型
	 * @author Karelian_na
	 * @date 2023/09/08 20:18:36
	 * @type {EditItemType}
	 */
	type: EditItemType;

	/**
	 * @description 字段的表单检验规则
	 * @author Karelian_na
	 * @date 2023/09/08 20:18:19
	 * @type {FormRules[""]}
	 */
	rule?: FormRules[""];

	/**
	 * @description 字段类型 {@link EditItemType} = "enum" 时，字段可供选择的值的集合
	 * @author Karelian_na
	 * @date 2023/09/08 20:16:27
	 * @type {IEnumItem[]}
	 */
	enumItems?: Array<IEnumItem>;

	/**
	 * 字段类型 {@link EditItemType} = "enum" 时，编辑时候字段可供选择的值的集合
	 *
	 * @author Karelian_na
	 * @date 2024/09/23 09:21:46
	 */
	tempEnumItems?: Array<IEnumItem>;

	/**
	 * @description 依赖本字段的字段
	 * @author Karelian_na
	 * @date 2023/09/08 20:15:50
	 * @type {FieldsConfig}
	 */
	children?: FieldsConfig;

	/**
	 * @description 给定编辑或显示详情时是否显示该字段的回调
	 * @author Karelian_na
	 * @date 2023/09/08 20:15:12
	 * @type {FieldShowCallback}
	 */
	show?: FieldShowCallback | boolean;

	/**
	 * @description 绑定到ElTableColumn组件的其它属性
	 * @author Karelian_na
	 * @date 2023/09/08 20:14:17
	 * @type {TableColumnInstance["$props"]}
	 */
	columnBindProps?: TableColumnInstance["$props"];
}

/**
 * 字段配置集
 */
export type FieldsConfig = Record<string, IFieldConfig>;

/**
 * 操作按钮属性
 * @export
 * @interface IOperButton
 */
export interface IOperButton {
	/**
	 * 按钮触发时的请求地址
	 * @type {string}
	 * @memberof IOperButton
	 */
	action?: string;

	/**
	 * 按钮触发时的类型
	 * @type {string}
	 * @memberof IOperButton
	 */
	type: string;

	/**
	 * 按钮展示图标
	 * @type {string}
	 * @memberof IOperButton
	 */
	icon: string;

	/**
	 * 按钮展示的文本
	 * @type {string}
	 * @memberof IOperButton
	 */
	title: string;

	/**
	 * 按钮的操作类型
	 * 1：仅可集体操作，显示在操作栏
	 * 2：仅可单独操作，显示在表格操作栏
	 * 3：既可单独操作也可集体操作
	 * @type {number}
	 * @memberof IOperButton
	 */
	oper_type: number;

	/**
	 * ElButton's props
	 *
	 * @author Karelian_na
	 * @date 2024/09/19 18:47:20
	 */
	props?: ButtonInstance["$props"];

	/**
	 * 按钮展示的条件
	 *
	 * @author Karelian_na
	 * @date 2024/09/25 19:15:18
	 */
	condition?: (data: KeyStringObject) => boolean;
}

/**
 * 实现详细对话框的按钮属性，它是一个伪按钮，详细框的显示是在双击表格行时触发。
 *
 * 为了使事件统一，将双击动作视为详细按钮点击动作传递给 {@link OperColumnButtonClickHandler} .
 */
export const detailButton: IOperButton = {
	icon: "details",
	oper_type: 2,
	title: "详情",
	type: "details",
};

export const searchButton: IOperButton = {
	icon: "search",
	oper_type: 1,
	title: "搜索",
	type: "search",
};

/**
 * 页面数据类型
 * @export
 * @interface IPageData
 */
export interface IPageData {
	/**
	 * 数据总量
	 * @type {number}
	 * @memberof IPageData
	 */
	totalCount: number;

	/**
	 * 当前页码
	 * @type {number}
	 * @memberof IPageData
	 */
	curPageIdx: number;

	/**
	 * 该页数据
	 * @type {KeyStringObject[]}
	 * @memberof IPageData
	 */
	data: Array<KeyStringObject>;
}

/**
 * 首次加载列表页面时，从服务器获取的有关该页面的数据属性
 * @export
 * @interface IPageInfo
 */
export interface IPageInfo {
	/**
	 * @description 字段配置
	 * @author Karelian_na
	 * @date 2024/02/20 14:00:00
	 * @type {string}
	 * @memberof IPageInfo
	 */
	fieldsConfig: string;

	/**
	 * 第一页的数据
	 * @type {IPageData}
	 * @memberof IPageInfo
	 */
	pageData: IPageData;

	/**
	 * 该列表页的字段
	 * @type {Array<IField>}
	 * @memberof IPageInfo
	 */
	fields: Array<IField>;

	/**
	 * 该页拥有的操作按钮（权限）
	 * @type {Array<IOperButton>}
	 * @memberof IPageInfo
	 */
	operButtons: Array<IOperButton>;

	/**
	 * 特定于页面的附加数据
	 * @type {Record<string, any>}
	 * @memberof IPageInfo
	 */
	extraData: Record<string, any>;
}

/**
 * 数据展示页面的相关属性
 * @export
 * @interface IIndexPageProps
 */
export interface IIndexPageProps {
	/**
	 * 请求服务器数据的地址
	 * @type {string}
	 * @memberof IIndexPageProps
	 */
	indexUrl: string;

	/**
	 * 相对于 {@link indexUrl} 的上级请求地址
	 * @type {string}
	 * @memberof IIndexPageProps
	 */
	parentUrl: string;

	/**
	 * 服务器获取的该页面的数据属性
	 * @type {IPageInfo}
	 * @memberof IIndexPageProps
	 */
	info: IPageInfo;

	/**
	 * 该页面的所有字段
	 * @type {Fields}
	 * @memberof IIndexPageProps
	 */
	allFields: Fields;

	/**
	 * 该页面的展示字段
	 * @type {Fields}
	 * @memberof IIndexPageProps
	 */
	displayFields: Fields;

	/**
	 * 该页面的可检索字段
	 * @type {Fields}
	 * @memberof IIndexPageProps
	 */
	searchableFields: Fields;

	/**
	 * 操作栏按钮
	 * @type {Record<string, IOperButton>}
	 * @memberof IIndexPageProps
	 */
	operbarButtons: Record<string, IOperButton>;

	/**
	 * 表格操作列按钮
	 * @type {Record<string, IOperButton>}
	 * @memberof IIndexPageProps
	 */
	operColumnButtons: Record<string, IOperButton>;
}

/**
 * 请求页面数据的参数
 * @export
 * @interface IDataRequestParam
 * @extends {KeyStringObject}
 */
export interface IDataRequestParam extends KeyStringObject {
	/**
	 * 请求的页码
	 * @type {number}
	 * @memberof IDataRequestParam
	 */
	pageIdx?: number;

	/**
	 * 请求的页面大小
	 * @type {number}
	 * @memberof IDataRequestParam
	 */
	pageSize?: number;

	/**
	 * 请求检索的字段
	 * @type {string}
	 * @memberof IDataRequestParam
	 */
	searchField?: string;

	/**
	 * 当 {@link searchField} 指定时，相对于该字段将要检索的值
	 * @type {string}
	 * @memberof IDataRequestParam
	 */
	searchKey?: string;
}

export interface IOperAttrs {
	tip?: string;
	action?: string;
	sendData?: any;
	extraMsgBoxOptions?: AlertOptions;
}

/**
 * 数据操作类型
 */
export type DataOperAction = "add" | "edit" | "delete";

/**
 * 当 IndexTemplate 接收到服务器返回的 {@link IPageInfo} 时执行的回调，用于处理相关属性；
 *
 * @param {IIndexPageProps} pageProps 页面的相关属性
 */
export type PageInfoHandler = (pageProps: IIndexPageProps) => void;

/**
 * 在 IndexTemplate 请求数据前，执行的回调。用来调整相关请求参数
 * @param {AxiosRequestOption & { params: IDataRequestParam }} params 请求服务器的参数
 */
export type RefreshCallback = (params: AxiosRequestOption & { params: IDataRequestParam }) => void;

/**
 * 当 IndexTemplate 接收到请求的数据时，执行的回调。该回调用来处理接受的数据
 * @param {IPageData} pageData 接受的数据
 */
export type RefreshedDataCallback = (pageData: Array<KeyStringObject>) => void;

/**
 * 当执行完由 {@link IOperButton} 触发的数据操作时，执行的回调。用来调整改变后的数据，以便正常更新数据的展示
 * @param {string} action 导致数据改变的操作，取自于 {@link IOperButton.type} 属性
 * @param {KeyStringObject} data 改变后的数据
 * @param {Array<KeyStringObject>} all 改变后的当前页面的所有数据
 */
export type DataChangedCallback<T extends any = any> = (action: string, data: T, all?: Array<T>) => boolean;

/**
 * 操作栏按钮点击时触发的回调
 * @param {IOperButton} button 点击的按钮的操作属性
 * @param {Record<string, IOperButton>} buttons 页面所拥有的所有的操作按钮属性
 */
export type OperbarButtonClickHandler = (button: IOperButton, buttons: Record<string, IOperButton>, modalDialogProps?: IDialogProps) => boolean | IOperAttrs;

/**
 * 表格操作列按钮点击时触发的回调
 * @param {IOperButton} button 点击的按钮的操作属性
 * @param {KeyStringObject} param 点击的按钮所在的行的数据
 * @param {Record<string, IOperButton>} buttons 页面所拥有的所有的操作按钮属性
 */
export type OperColumnButtonClickHandler = (
	button: IOperButton,
	param: KeyStringObject | null,
	buttons: Record<string, IOperButton>,
	modalDialogProps?: IDialogProps
) => boolean | IOperAttrs;

/**
 * 在对话框弹出前， EditTemplate 初始化，更新操作数据的回调
 * @param {Optional<KeyStringObject>} rawData 操作的表单的数据，该数据为 {@link IDialogProps.data} 的副本
 */
export type UpdatingFormDataHandler = (
	rawData: Optional<Arrayable<KeyStringObject>>,
	base: (rawData: Optional<KeyStringObject>, ...ignoreFields: Array<string>) => KeyStringObject,
	modalDialogProps?: IDialogProps
) => Promisable<KeyStringObject>;

export interface IDiaglogFormData<T extends KeyStringObject = KeyStringObject> {
	raw: Optional<T>;
	init: Optional<T>;
	current: Optional<T>;
}

/**
 * called when user click the commit button, for collecting post data.
 * @param {IDiaglogFormData} formData the formData info, contains raw, init and current.
 * @param {Ref<KeyStringObject>} postData the commit data which is difference between current formData and init formData.
 * @returns {string | void} when return type is string, the return value should be request url's query.
 */
export type CollectingPostDataHandler = (formData: IDiaglogFormData, postData: Ref<KeyStringObject>, mode: string) => string | void;

/**
 * 当收集表单提交数据时，不希望 EditTemplate 托管请求，返回该值并使 postData 对象为空对象，这需要自己决定请求的接受与发送
 */
export const CollectEnd = "end";

/**
 * called when editTemplate's init formData was confirmed, maybe do something for field and its config.
 * @param {KeyStringObject} formData 当前对话框中表单的数据
 * @param {Fields} fields 表单的所有字段属性
 * @param {mode} 当前对话框模式
 */
export type PreparedCallback = (formData: KeyStringObject, fields: Fields, mode?: string) => void;

/**
 * called when editTemplate was rendered, maybe do something on dom, etc
 * @param {KeyStringObject} formData 当前对话框中表单的数据
 */
export type RenderedCallback = (formData: KeyStringObject) => void;

/**
 * 在对话框离开前的回调，用于觉得是否离开
 * @param {KeyStringObject} formData 表单数据集
 * @param {Function} base 上一个处理的回调
 * @returns {Function | boolean} 返回处理结果，当该结果 boolean 类型时，指定是否退出；结果为 Function 时，为确认离开，且离开后调用该函数
 */
export type BeforeLeaveCallback = (formData: IDiaglogFormData, base: () => boolean) => Promisable<Function | boolean>;

/**
 * 在提交表单时，执行的回调。
 *
 * 区别于 {@link CollectingPostDataHandler}， 它只是收集将要提交的数据，并未得到用户的确认，
 *
 * 而该回调是用户确认提交后，在执行提交动作前的回调，一般用于执行此次提交前的某些特定提交或处理
 * @param {KeyStringObject} postData 将要提交的表单的数据
 */
export type BeforeSubmitHandler = (postData: KeyStringObject) => Promise<boolean> | boolean;

export type Prop<T> = {
	type: PropType<T>;
	required: true;
};

export type OptionalProp<T> = {
	type: PropType<T>;
	required: false;
};

export interface IIndexTemplateQueryProps extends Record<string, any> {
	pageIdx?: number;
	pageSize?: number;
}

declare const indexTemplateProps: {
	url: Prop<string>;
	head: Prop<string>;

	query: OptionalProp<IIndexTemplateQueryProps>;
	loading: OptionalProp<ILoading>;
	localSearch: OptionalProp<boolean>;
	noPagination: OptionalProp<boolean>;
	showIndexColumn: OptionalProp<boolean>;
	noSelectionColumn: OptionalProp<boolean>;
	defaultSearchField: OptionalProp<string>;
	tableProps: OptionalProp<TableInstance["$props"]>;
	selectionColumnProps: OptionalProp<InstanceType<typeof ElTableColumn>["$props"]>
	onRefreshData: OptionalProp<RefreshCallback>;
	onDataChanged: OptionalProp<DataChangedCallback>;
	onPageInfoHandled: OptionalProp<PageInfoHandler>;
	onDataRefreshed: OptionalProp<RefreshedDataCallback>;
	onEditTemplatePrepared: OptionalProp<PreparedCallback>;
	onOperbarButtonClick: OptionalProp<OperbarButtonClickHandler>;
	onOperColumnButtonClick: OptionalProp<OperColumnButtonClickHandler>;
};
export type IndexTemplateProps = ExtractPropTypes<typeof indexTemplateProps>;
export type IndexTemplateInsType = InstanceType<typeof IndexTemplate>;

declare const editTemplateProps: {
	mode: Prop<string>;
	title: Prop<string>;
	fields: Prop<Fields>;

	action: OptionalProp<string>;
	rawData: OptionalProp<KeyStringObject>;
	operAction: OptionalProp<DataOperAction>;
	onPrepared: OptionalProp<PreparedCallback>;
	onRendered: OptionalProp<Function>;
	modalDialogProps: OptionalProp<IDialogProps>;
	onUpdatedData: OptionalProp<DataChangedCallback>;
	onBeforeLeave: OptionalProp<BeforeLeaveCallback>;
	onBeforeSubmit: OptionalProp<BeforeSubmitHandler>;
	onUpdatingFormData: OptionalProp<UpdatingFormDataHandler>;
	onCollectingPostData: OptionalProp<CollectingPostDataHandler>;
};
export type EditTemplateProps = ExtractPropTypes<typeof editTemplateProps>;

export type HandleEditTemplateProps = (props: EditTemplateProps) => EditTemplateProps;

export type EditItemType = "text" | "number" | "date" | "time" | "enum" | "image" | "file" | "radio" | "switch" | "custom" | "checkbox" | "json";

export namespace TemplateUtils {
	export async function resolveFieldConfigs(content: string): Promise<FieldsConfig> {
		if (!content) {
			return {};
		}

		let res: FieldsConfig = {};
		const blob = new Blob([content], { type: "application/javascript" });
		const url = URL.createObjectURL(blob);

		try {
			const module = await import(/* @vite-ignore */ url);
			res = module.default;
			Object.entries(res).forEach(([name, config], idx) => {
				config.index = idx;
			});
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error("Failed to resove fieldConfigs!");
		}

		return res ?? {};
	}

	export function mapDataValueToLabel(field: IField, value: number | string | undefined) {
		if (value === undefined) {
			return value;
		}

		const isMultiSelect = field.config.bindProps?.multiple;

		const enums = field.config.enumItems;
		if (!enums) {
			return value;
		}

		if (!isMultiSelect) {
			switch (typeof value) {
				case "number":
				case "string":
				case "boolean":
					return enums.find((item) => item.value == value)?.label;
				default:
					break;
			}
			return value;
		}

		if (!value || !Array.isArray(value) || value.length === 0) {
			return value;
		}

		return enums
			.reduce((prev, cur) => {
				if (value.includes(cur.value)) {
					prev.push(cur.label);
				}

				return prev;
			}, new Array<string>())
			.join(",");
	}

	export function getMultiSelectChanges(formData: IDiaglogFormData, fieldName: string) {
		const oldIds: Array<number> = Array.from(formData.init![fieldName] ?? []);

		const itemChanges = new Array<{ id: number; type: Number }>();
		(formData.current![fieldName] as Array<number>).forEach((item, idx) => {
			const oldIdx = oldIds.findIndex((id) => id === item);
			if (-1 !== oldIdx) {
				oldIds.remove(oldIdx);
				return;
			}

			itemChanges.push({ id: item, type: 1 });
		});

		oldIds.forEach((item) => {
			itemChanges.push({ id: item, type: 0 });
		});

		return itemChanges;
	}

	export interface IExportOptions {
		fileName: string | (() => string);
		sheetName?: string;
		loading: ILoading;
	}

	export function exportDataToFile(data: Array<any>, fields: Fields, options: IExportOptions) {
		options.loading.value = true;
		options.loading.tip = "正在导出，请稍等...";

		const workbook = new ExcelJS.Workbook();
		workbook.creator = "kare-admin-site";

		const fileName = options.fileName instanceof Function ? options.fileName() : options.fileName;
		const worksheet = workbook.addWorksheet(options.sheetName ?? fileName);

		worksheet.columns = Object.values(fields)
			.sort((l, r) => l.display_order - r.display_order)
			.map((field) => ({
				header: field.display_name,
				key: field.field_name,
			}));

		const enumableFields = Object.values(fields).filter((item) => item.config.enumItems);
		data.forEach((item, idx) => {
			options.loading.tip = `正在导出第 ${idx} 条数据...`;
			const data = Object.assign({}, item);
			enumableFields.forEach((field) => {
				data[field.field_name] = TemplateUtils.mapDataValueToLabel(field, data[field.field_name]);
			});

			worksheet.addRow(data);
		});

		options.loading.tip = "正在导出，请稍等...";
		workbook.xlsx.writeBuffer().then((buffer) => {
			const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
			const link = document.createElement("a");
			link.href = URL.createObjectURL(blob);

			link.download += fileName + ".xlsx";

			options.loading.tip = "导出完成！";
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			options.loading.value = false;
		});
	}

	export function searchByField(data: Array<any>, indexTemplateIns: IndexTemplateInsType) {
		if (!Array.isArray(data) || !indexTemplateIns) {
			return;
		}

		const elements = indexTemplateIns.getTableRowElements();
		if (data.length != elements.length) {
			error("msg", { message: "无法完成搜索，数据条目与元素不匹配！" });
			return;
		}

		const searchField = indexTemplateIns.operbar.searchField;
		const searchKey = indexTemplateIns.operbar.searchKey;
		data.forEach((item, idx) => {
			const value = item[searchField];
			if (!searchKey || (value && String(value).includes(searchKey))) {
				if (elements[idx].style.display == "none") {
					elements[idx].style.display = "";
				}
				return;
			}

			elements[idx].style.display = "none";
		});
	}
}
