/**
 * @format
 * @Author: Karelian_na
 */

export namespace Animation {
	export type DropDownElement = HTMLElement & { timeID?: number };

	export function dropDown(element: DropDownElement, time: number, callback?: Function) {
		if (time <= 0) {
			throw Error("动画时长不合法");
		}

		if (element.timeID) {
			window.cancelAnimationFrame(element.timeID);
			element.timeID = undefined;
		}

		let startValue = 0,
			endValue = 0;
		if (element.clientHeight == 0) {
			// 保存将要设置的元素属性的原有值
			const propNames = ["display", "visibility", "position"] as Array<keyof CSSStyleDeclaration>;
			const props = propNames.reduce((prev, cur) => {
				(prev[cur] as any) = element.style[cur];
				return prev;
			}, {} as CSSStyleDeclaration);

			// 设置元素指定属性，获取元素最大高度
			Object.assign(element.style, {
				display: "block",
				visibility: "hidden",
				position: "absolute",
			});
			element.style.removeProperty("height");
			endValue = element.clientHeight;

			// 恢复元素初始状态
			Object.assign(element.style, props);
		} else {
			startValue = element.clientHeight;
		}

		const speed = (endValue - startValue) / time;

		let startTimestamp: DOMHighResTimeStamp;
		let prevTimestamp: DOMHighResTimeStamp;
		const step = function (timestamp: DOMHighResTimeStamp) {
			if (!startTimestamp) {
				startTimestamp = timestamp;
			}

			const elapsedTime = timestamp - startTimestamp;

			if (prevTimestamp !== timestamp) {
				const newValue = elapsedTime * speed + startValue;
				element.style.height = newValue + "px";
			}

			if (elapsedTime < time) {
				prevTimestamp = timestamp;
				element.timeID = window.requestAnimationFrame(step);
				return;
			}

			element.style.height = "";
			callback?.call(null);
		};
		element.timeID = window.requestAnimationFrame(step);
	}
}
