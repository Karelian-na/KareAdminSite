<!-- @format -->

<script setup lang="ts">
	import type { Ref } from "vue";
	import type { IUserInfo } from "@/common";
	import type { Optional } from "@/common/utils";
	import type { CollectingPostDataHandler } from "../templates";

	import IconFont from "@/components/IconFont.vue";
	import EditItem from "@/views/$frames/templates/EditItem.vue";
	import EditTemplate from "@/views/$frames/templates/EditTemplate.vue";
	import { ElContainer, ElHeader, ElMain, ElButton } from "element-plus";

	import Store from "store";

	import { loginFields } from ".";
	import { sha256 } from "js-sha256";
	import { useRouter } from "vue-router";
	import { CollectEnd } from "../templates";
	import { EmptyObject } from "@/common/utils";
	import { adminRequest } from "@/common/utils/Network";
	import { inject, onBeforeMount, reactive, ref } from "vue";
	import { error, success } from "@/common/utils/Interactive";

	const userInfo = inject<Ref<Optional<IUserInfo>>>("userInfo")!;
	const editTemplateIns = ref<InstanceType<typeof EditTemplate>>(EmptyObject);

	const loginLoading = reactive({
		value: false,
	});

	const router = useRouter();
	const formData = { account: "", pwd: "", remember: false };

	onBeforeMount(() => {
		userInfo.value = undefined;
		const infoStore = Store.namespace("info");
		formData.account = infoStore.get("account");
		formData.pwd = infoStore.get("pwd");
		formData.remember = infoStore.get("remember");
	});

	const onCollectingPostData: CollectingPostDataHandler = function (formData, postData) {
		if (!Object.keys(postData.value).length) {
			return;
		}

		const data = Object.assign({}, postData.value);
		postData.value = {};
		setTimeout(async () => {
			const pwd = data["pwd"];
			data["pwd"] = sha256(pwd);

			const result = await adminRequest({
				method: "POST",
				url: "/login",
				data: data,
				extraOptions: {
					loading: loginLoading,
					alwaysShowFeedbackMsg: false,
				},
			});

			if (!result.success) {
				error("msg", {
					message: `登陆失败! ${result.msg}`,
					duration: 5000,
				});
				return;
			}

			const infoStore = Store.namespace("info");
			infoStore.set("account", data["account"]);
			if (data["remember"] === true) {
				infoStore.set("pwd", pwd);
				infoStore.set("remember", data["remember"]);
			} else {
				infoStore.remove("pwd");
				infoStore.remove("remember");
			}

			Store.namespace("cookie").set("value", true);
			router.push({ name: "index" });
			success("msg", { message: "登陆成功!" });
		}, 10);
		return CollectEnd;
	};

	function onForgetPasswordClick() {
		if (!loginLoading.value) {
			router.push({
				name: "retrieve",
				query: {
					account: formData.account,
				},
			});
		}
	}
</script>

<template>
	<div class="cover">
		<ElContainer class="position-center">
			<ElHeader>登陆</ElHeader>
			<ElMain>
				<EditTemplate
					title="登陆"
					mode="login"
					action="/login"
					oper-action="add"
					ref="editTemplateIns"
					:raw-data="formData"
					:fields="loginFields"
					:modal-dialog-props="({ mode: 'edit' } as any)"
					@collecting-post-data="onCollectingPostData"
				>
					<template #layouts="{ formData, fields }">
						<EditItem
							v-model="formData['account']"
							:field="fields['account']"
							@keyup.enter="editTemplateIns.submit"
						>
							<template #prepend>
								<IconFont value="user-line" />
							</template>
						</EditItem>
						<EditItem
							class="pwd"
							v-model="formData['pwd']"
							:field="fields['pwd']"
							@keyup.enter="editTemplateIns.submit"
						>
							<template #prepend>
								<IconFont value="password" />
							</template>
						</EditItem>
						<EditItem
							class="remember"
							v-model="formData['remember']"
							:field="fields['remember']"
						/>
					</template>

					<template #operations="{ onSubmit }">
						<ElButton
							type="primary"
							:loading="loginLoading.value"
							@click="onSubmit"
							>立即登录
						</ElButton>
						<span
							class="link"
							@click="onForgetPasswordClick"
							>忘记密码 |
						</span>
						<span
							class="link"
							@click="onForgetPasswordClick"
						>
							&nbsp;注册账号
						</span>
					</template>
				</EditTemplate>
			</ElMain>
		</ElContainer>
	</div>
</template>
<style lang="css" scoped>
	div.cover {
		background-image: url("/assets/imgs/login.jpg");
		background-repeat: no-repeat;
		background-size: cover;
		background-position: center;
		min-width: 450px;
		position: relative;
		min-width: 45em;
		width: 100%;
		height: 100%;
	}

	.el-container {
		position: absolute;
		width: 450px;
		height: max-content;

		padding: 30px 40px;
		background-color: white;
		box-shadow: 0 0 20px #16b4f2;

		border-radius: 20px;
	}

	.el-header {
		font-size: 1.5em;
		text-align: center;
		color: #595959;
		margin-top: 20px;
		margin-bottom: 40px;
		height: max-content;
	}

	.el-main {
		padding: 0;
	}

	.el-main .edit-item.pwd,
	.el-main .edit-item.remember {
		margin-bottom: 1em;
	}

	.el-main :deep(.edit-item.operations .el-form-item__content) {
		margin-left: 0 !important;
		justify-content: center;
	}
	.el-main :deep(.edit-item.operations .el-button) {
		width: 100%;
		font-size: 20px;
		height: 2em;
	}
	.edit-item.operations .link {
		line-height: 1;
		width: max-content;
		margin-top: 15px;
		font-size: 14px;
		cursor: pointer;
		height: initial;
	}
	.edit-item.operations .link:hover {
		color: var(--el-color-primary);
	}
</style>
