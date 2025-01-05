/** @format */

import type { KeyStringObject } from "@/common/utils";
import type { ILoading } from "@/common/utils/Interactive";
import type { BeforeLeaveCallback, DataOperAction } from "@/views/$frames/templates";

/**
 * a back-end record interface
 *
 * @author Karelian_na
 * @date 2025/01/04 15:07:00
 * @export
 * @interface IRecord
 */
export interface IRecord extends KeyStringObject {
	id: number;
};

/**
 * @description 用户简要信息接口
 * @author Karelian_na
 * @date 2023/09/14 09:24:25
 * @export
 * @interface IUserInfo
 */
export interface IUserInfo {
	name: string;
	avatar: string;
}

/**
 * @description 对话框控制相关属性
 * @author Karelian_na
 * @date 2023/09/14 09:25:04
 * @export
 * @interface IDialogProps
 */
export interface IDialogProps {
	/**
	 * @description 标识当前对话框是否可见
	 * @author Karelian_na
	 * @date 2023/09/14 09:25:23
	 * @type {boolean}
	 * @memberof IDialogProps
	 */
	show: boolean;

	/**
	 * @description 控制对话框的宽度
	 * @author Karelian_na
	 * @date 2023/09/15 19:29:16
	 * @type {number}
	 * @memberof IDialogProps
	 */
	width?: number | string;

	/**
	 * @description 标识当前对话框模式
	 * @author Karelian_na
	 * @date 2023/09/14 09:25:42
	 * @type {string}
	 * @memberof IDialogProps
	 */
	mode: string;

	/**
	 * @description 操作按钮单一时，按钮的显示文本
	 * @author Karelian_na
	 * @date 2023/09/14 09:28:46
	 * @type {string}
	 * @memberof IDialogProps
	 */
	operLabel: string;

	/**
	 * @description 对话框加载动画控制属性
	 * @author Karelian_na
	 * @date 2023/09/15 20:51:43
	 * @type {ILoading}
	 * @memberof IDialogProps
	 */
	loading: ILoading;

	/**
	 * @description 当前对话框中传递的原始数据
	 * @author Karelian_na
	 * @date 2023/09/14 09:29:55
	 * @type {(KeyStringObject | Array<KeyStringObject>)}
	 * @memberof IDialogProps
	 */
	data: KeyStringObject | Array<KeyStringObject>;

	/**
	 * @description 对话框表单提交时的动作
	 * @author Karelian_na
	 * @date 2023/09/14 09:30:15
	 * @type {DataOperAction}
	 * @memberof IDialogProps
	 */
	operAction?: DataOperAction;

	/**
	 * @description 表单提交时的请求地址
	 *
	 * @author Karelian_na
	 * @date 2024/09/20 20:42:05
	 */
	action?: string;

	/**
	 * @description 对话框离开前的回调，觉得是否离开
	 * @author Karelian_na
	 * @date 2023/09/14 09:30:31
	 * @type {BeforeLeaveCallback}
	 * @memberof IDialogProps
	 */
	askIfNeedToLeave?: BeforeLeaveCallback;
}

/**
 * @description 预览对话框的控制属性
 * @author Karelian_na
 * @date 2023/09/14 09:32:14
 * @export
 * @interface IPreviewDialogProps
 */
export interface IPreviewDialogProps {
	/**
	 * @description 标识是否显示预览对话框
	 * @author Karelian_na
	 * @date 2023/09/14 09:32:31
	 * @type {boolean}
	 * @memberof IPreviewDialogProps
	 */
	show: boolean;

	/**
	 * @description 预览的图片的地址
	 * @author Karelian_na
	 * @date 2023/09/14 09:32:46
	 * @type {string}
	 * @memberof IPreviewDialogProps
	 */
	src: string;
}
