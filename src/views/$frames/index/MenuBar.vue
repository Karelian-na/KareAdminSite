<!-- @format -->

<script setup lang="ts">
	import type { IUserInfo } from "@/common";
	import type { Component, ComponentPublicInstance } from "vue";
	import type { ITab, SwitchPageFunction, TabPageMapType } from ".";

	import Settings from "./Settings.vue";
	import IconFont from "@/components/IconFont.vue";
	import { ElAvatar, ElDrawer } from "element-plus";

	import Store from "store";

	import { specialTabs } from ".";
	import { useRouter } from "vue-router";
	import { inject, ref, Ref, shallowRef } from "vue";
	import { axiosRequest } from "@/common/utils/Network";
	import { confirm, success } from "@/common/utils/Interactive";

	const router = useRouter();
	const curTab = inject<Ref<ITab>>("curTab")!;
	const userInfo = inject<Ref<IUserInfo>>("userInfo")!;
	const switchPage = inject<SwitchPageFunction>("switchPage")!;
	const tabMapPage = inject<Ref<TabPageMapType>>("tabMapPage")!;

	const drawer = ref(false);
	const drawerComponentIns = ref<ComponentPublicInstance>();
	const drawerComponent = shallowRef<Component>(undefined as any);

	function fullscreenOnclick() {
		document.documentElement.requestFullscreen();
	}

	function onRefreshPage() {
		curTab.value.key = new Date().getTime();
	}

	function onPersonalTabClick() {
		if (!tabMapPage.value.get(specialTabs.personal)) {
			tabMapPage.value.set(specialTabs.personal, specialTabs.personal.name);
		}
		switchPage(specialTabs.personal, false);
	}

	function exitOnclick() {
		confirm("确定要退出?", {
			callback: (action, _ins) => {
				if (action != "confirm") return;

				axiosRequest({
					method: "POST",
					url: "/logout",
					callback: () => {
						Store.namespace("cookie").each((val, key) => {
							Store.namespace("cookie").remove(key);
						});
						success("msg", { message: "退出成功!" });
						router.replace({ name: "login" });
						return true;
					},
				});
			},
		});
	}

	function onSettingsClick() {
		drawer.value = true;
		drawerComponent.value = Settings;
	}

	async function onDrawerBeforClose(done: () => void) {
		let res = true;
		if ((drawerComponentIns.value as any)?.onExit) {
			res = await (drawerComponentIns.value as any).onExit();
		}

		if (res) {
			done();
			drawerComponent.value = undefined as any;
		}
	}
</script>

<template>
	<div class="menubar">
		<div class="operations">
			<IconFont
				title="刷新当前页面"
				value="refresh"
				@click="onRefreshPage"
			/>
			<IconFont
				title="全屏"
				value="fullscreen"
				@click="fullscreenOnclick"
			/>
		</div>
		<div class="personal">
			<div class="preferences">
				<IconFont
					title="设置"
					value="settings"
					@click="onSettingsClick"
				/>
				<ElDrawer
					destroy-on-close
					v-model="drawer"
					title="设置"
					direction="rtl"
					size="22em"
					:before-close="onDrawerBeforClose"
				>
					<component
						ref="drawerComponentIns"
						:is="drawerComponent"
					></component>
				</ElDrawer>
			</div>
			<div class="info">
				<ElAvatar
					class="avatar"
					:src="userInfo.avatar"
				/>
				<span class="name">{{ userInfo.name }}</span>
				<ul class="options popup">
					<li
						class="item"
						@click="onPersonalTabClick"
					>
						个人中心
					</li>
					<li
						class="item"
						@click="exitOnclick"
					>
						退出登陆
					</li>
				</ul>
			</div>
		</div>
	</div>
</template>

<style scoped>
	.menubar {
		display: flex;
		align-items: center;
	}

	.menubar .operations {
		/* Layout */
		display: inline-block;
	}
	.operations :deep(.iconfont) {
		width: 2.5em;
		cursor: pointer;
		transition: color 0.3s ease-in-out;
	}
	.operations :deep(.iconfont:hover) {
		font-weight: bold;
		color: var(--hover-text-color);
	}

	.menubar .personal {
		/* Layout */
		padding-right: 1em;
		height: 100%;
		margin-left: auto;
		display: inline-flex;
		align-items: center;
	}

	.personal .preferences {
		/* Layout */
		display: inline-flex;
	}
	.preferences :deep(.iconfont) {
		/* Layout */
		display: inline-block;
		width: 2em;
		font-size: 1.2em;

		/* Appearance */
		cursor: pointer;
	}
	.preferences :deep(.iconfont:hover) {
		/* Appearance */
		color: var(--hover-text-color);
		font-weight: bold;
		transition: color var(--transition-duration) ease-in-out;
	}
	.preferences :deep(.el-drawer__body) {
		padding: 0;
		padding-right: 1em;
	}

	.personal .info {
		/* Layout */
		position: relative;
		height: 100%;

		/* Appearance */
		cursor: pointer;
		display: flex;
		align-items: center;
	}

	.personal .info .avatar {
		width: 1.5em;
		height: 1.5em;
		margin-right: 0.5em;
	}
	.personal .info .options {
		/* Layout */
		display: none;
		position: absolute;
		right: 0;
		top: 2.5em;
		z-index: 10;

		/* Appearance */
		border: 1px solid var(--border-color);

		/* Other */
		border-radius: 5px;
	}

	.personal .info:hover .options {
		/* Layout */
		display: initial;

		/* Animation */
		animation: shrinked-display-animation 0.3s ease-in-out;
		transform-origin: 8em 0;
	}

	.info .options .item {
		/* Layout */
		margin: 0 1em;
		line-height: 2.5em;

		/* Animation */
		transition: color 0.3s ease-in-out;
	}

	.info .options .item:hover {
		/* Appearance */
		color: var(--hover-text-color);
	}

	@keyframes shrinked-display-animation {
		from {
			opacity: 0%;
			transform: scale(0.5);
		}
		to {
			opacity: 100%;
			transform: scale(1);
		}
	}
</style>
