<!-- @format -->

<script setup lang="ts">
	import type { DetailMenuItem } from ".";
	import type { KeyStringObject } from "@/common/utils";
	import type { ILoading } from "@/common/utils/Interactive";
	import type {
		PageInfoHandler,
		DataChangedCallback,
		RefreshedDataCallback,
		OperbarButtonClickHandler,
		OperColumnButtonClickHandler,
		IEnumItem,
	} from "@/views/templates";

	import Edit from "./Edit.vue";
	import AoTag from "@/components/AoTag.vue";
	import IconFont from "@/components/IconFont.vue";
	import IndexTemplate from "@/views/templates/IndexTemplate.vue";

	import { inject, ref } from "vue";
	import { EmptyObject } from "@/common/utils";
	import { handleMenus, MenuType, MenuTypeFields, MenuTypeNames, Menu } from ".";

	const props = defineProps<{
		url: string;
		head: string;
	}>();

	const pageLoading = inject<ILoading>("pageLoading")!;

	let allSortedMenus = new Array<Menu>();
	let allParentableMenus = new Array<Menu>();
	let expandedRows: Map<number, Menu> = new Map();

	const parentableMenus = ref(new Array<Menu>());
	const indexTemplateIns = ref<InstanceType<typeof IndexTemplate>>(EmptyObject);

	const onPageInfoHandled: PageInfoHandler = function (pageProps) {
		if (pageProps.operColumnButtons["add"]) {
			pageProps.operColumnButtons["add"].condition = (data) => data["type"] != MenuType.Oper;
		}
		pageProps.operbarButtons["expand-all"] = {
			type: "expand-all",
			icon: "expand-all",
			title: "全部展开/折叠",
			oper_type: 1,
		};

		const permissions = pageProps.info.extraData!["permissions"] as Array<any>;
		pageProps.allFields["pmid"].config.enumItems = permissions.reduce(
			(prev, cur) => {
				prev.push({
					label: `${cur.guid} (${cur.name})`,
					value: cur.id,
				});

				return prev;
			},
			[
				{
					label: "不关联权限",
					value: 0,
				},
			] as Array<IEnumItem>
		);
	};

	const onDataRefreshed: RefreshedDataCallback = function (pageData) {
		pageData.reset(handleMenus(pageData as any));
		allSortedMenus = Menu.flat(pageData as any);
		allParentableMenus = allSortedMenus.filter((value) => value.type != MenuType.Oper);
	};

	const onDataChanged: DataChangedCallback<Menu> = function (action, data, all) {
		const topLevelMenus = all!;
		switch (action) {
			case "add": {
				// added menu was top level
				if (!data.pid) {
					data.level = 1;
					topLevelMenus.push(data);
				} else {
					let parentIdx = allParentableMenus.findIndex((permi) => permi.id == data.pid);
					const addedsParent = allParentableMenus[parentIdx];
					if (addedsParent.children === undefined) {
						addedsParent.children = [];
					}
					data.level = addedsParent.level + 1;
					addedsParent.children!.push(data);
				}
				if (data.type !== MenuType.Oper) {
					allParentableMenus = Menu.flat(topLevelMenus).filter((value) => value.type != MenuType.Oper);
				}
				break;
			}
			case "edit": {
				const oldValue = Menu.find(data.id, topLevelMenus)!;
				if (data.pid !== oldValue.pid) {
					Menu.delete(oldValue.id, topLevelMenus);
					if (data.pid != null) {
						const newParent = Menu.find(data.pid, topLevelMenus)!;
						if (!newParent.children) {
							newParent.children = [];
						}
						newParent.children.push(oldValue);
					} else {
						topLevelMenus!.push(oldValue);
					}
				}

				if (data.status !== undefined) {
					const func = (item: Menu) => {
						item.status = data.status;
						item.children?.forEach(func);
					};
					oldValue.children?.forEach(func);

					if (data.status) {
						for (let temp = oldValue.parent; temp && !temp.status; temp = temp.parent) {
							temp.status = true;
						}
					}
				}
				for (const key in data) {
					(oldValue as KeyStringObject)[key] = data[key as keyof Menu];
				}
				break;
			}
			case "delete": {
				let idx = allParentableMenus.findIndex((val) => val.id == data.id);
				if (idx != -1) {
					const nextIdx = idx + 1;
					while (allParentableMenus[nextIdx]) {
						if (allParentableMenus[nextIdx].level <= allParentableMenus[idx].level) {
							break;
						}
						allParentableMenus.remove(nextIdx);
					}
					allParentableMenus.remove(idx);
				}

				Menu.delete(data.id, topLevelMenus);
				break;
			}
			default:
				break;
		}
		return true;
	};

	const operbarButtonClick: OperbarButtonClickHandler = function (button, buttons) {
		switch (button.type) {
			case "search": {
				break;
			}
			case "add": {
				indexTemplateIns.value.modalDialogProps.data = { id: null };
				parentableMenus.value = allParentableMenus;
				return false;
			}
			case "expand-all": {
				if (expandedRows.size != 0) {
					expandedRows.forEach((item) => indexTemplateIns.value.tableIns.toggleRowExpansion(item));
				} else {
					pageLoading.value = true;
					setTimeout(() => {
						allParentableMenus.forEach((item) => indexTemplateIns.value.tableIns.toggleRowExpansion(item));
						pageLoading.value = false;
					}, 250);
				}
				break;
			}
			default:
				return false;
		}
		return true;
	};

	const operColumnButtonClick: OperColumnButtonClickHandler = function (button, param) {
		const modalDialogProps = indexTemplateIns.value.modalDialogProps!;
		switch (button.type) {
			case "add":
				modalDialogProps.data = new Menu();
				modalDialogProps.data.pid = param?.["id"];
				parentableMenus.value = allParentableMenus;
				return false;
			case "edit": {
				let temp = new Array<Menu>();
				switch (param!["type"]) {
					case MenuType.Menu:
					case MenuType.Item:
						temp = allParentableMenus.filter((item) => item.type == MenuType.Menu);
						break;
					case MenuType.Page:
					case MenuType.Oper:
						temp = allParentableMenus.filter((item) => item.type < param!["type"]);
						break;
					default:
						break;
				}
				const idx = temp.findIndex((value) => value.id == param!["id"]);
				if (idx != -1) {
					parentableMenus.value = temp.slice(0, idx);
					for (let start = idx + 1; start < temp.length; ++start) {
						if (temp[start].level <= temp[idx].level) {
							parentableMenus.value.insert(parentableMenus.value.length, ...temp.slice(start));
							break;
						}
					}
				} else {
					parentableMenus.value = temp;
				}
				break;
			}
			default:
				return false;
		}
		return true;
	};

	const onTableExpandChange = function (row: DetailMenuItem, expanded: boolean) {
		if (expandedRows.has(row.id)) {
			expandedRows.delete(row.id);
		} else {
			expandedRows.set(row.id, row);
		}
	};
</script>

<template>
	<IndexTemplate
		ref="indexTemplateIns"
		v-bind="props"
		class="menu"
		:no-pagination="true"
		:show-index-column="true"
		:no-selection-column="true"
		:table-props="{
			rowKey: 'id',
			'onExpand-change': onTableExpandChange,
		}"
		@data-changed="onDataChanged"
		@data-refreshed="onDataRefreshed"
		@page-info-handled="onPageInfoHandled"
		@operbar-button-click="operbarButtonClick"
		@oper-column-button-click="operColumnButtonClick"
	>
		<template #name="{ data }">
			<IconFont
				v-if="data['icon']"
				:value="data['icon']"
			/>
			{{ data["name"] }}({{ data["id"] }})
		</template>

		<template #url="{ data }">
			<template v-if="data['url']">
				<a
					v-if="Menu.isExternalLink(data as any)"
					:href="data['url']"
					target="__blank"
					>{{ data["url"] }}
				</a>
				<template v-else>{{ data["url"] }}</template>
			</template>
			<template v-else-if="data['ref_id']">引用菜单 {{ data["ref_id"] }}</template>
		</template>

		<template #type="{ data }">
			<AoTag
				class="type"
				:class="MenuTypeFields[data['type']]"
				:icon="MenuTypeFields[data['type']]"
				:label="MenuTypeNames[data['type']] ?? ''"
			/>
		</template>

		<template #status="{ data }">
			<AoTag
				class="status"
				:class="data['status'] ? 'on' : 'off'"
				:label="data['status'] ? '启用' : '禁用'"
			/>
		</template>

		<template #editContent="attrs">
			<Edit
				v-if="['edit', 'add', 'details'].includes(attrs.mode)"
				v-bind="(attrs as any)"
				:parentable-menus="parentableMenus"
			/>
		</template>
	</IndexTemplate>
</template>

<style scoped lang="css">
	.menu :deep(.el-table__placeholder) {
		display: none;
	}

	.menu :deep(.name .cell) {
		vertical-align: baseline;
		white-space: nowrap;
	}

	.menu :deep(.ui-tag) {
		font-size: inherit;
	}

	.menu :deep(span.type),
	.menu :deep(span.status) {
		display: inline-block;
		padding: 0 5px;
		line-height: 1.7em;
		border-radius: 5px;
		color: white;
		vertical-align: baseline;
	}

	.menu :deep(span.type.menu) {
		background-color: chocolate;
	}

	.menu :deep(span.type.item) {
		background-color: #008c8c;
	}

	.menu :deep(span.type.page) {
		background-color: dodgerblue;
	}

	.menu :deep(span.type.oper) {
		background-color: darkgray;
	}

	.menu :deep(span.status.off) {
		background-color: brown;
	}

	.menu :deep(span.status.on) {
		background-color: var(--el-color-primary);
	}

	:global(.url a[href]) {
		text-decoration: underline;
	}
</style>
