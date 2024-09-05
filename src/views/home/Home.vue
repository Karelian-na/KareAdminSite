<!-- @format -->
<script setup lang="ts">
	import type { IUserInfo } from "@/common";

	import IconFont from "@/components/IconFont.vue";

	import { inject } from "vue";
	import { ElSpace, ElCard, ElAvatar, ElContainer, ElAside, ElMain, ElHeader, ElRow, ElCol, ElLink } from "element-plus";

	const userInfo = inject<IUserInfo>("userInfo")!;
	const quickEntrance = [
		// { icon: "man-role", title: "角色管理" },
		// { icon: "man-user", title: "用户管理" },
		// { icon: "man-data", title: "目录管理" },
		// { icon: "construction", title: "数据库管理" },
		// { icon: "construction", title: "教学成果申报管理" },
		// { icon: "practice", title: "实验室预约管理" },
		// { icon: "comprehensive", title: "奖项查询" },
		{ icon: "under-graduate", title: "管理系统" },
		{ icon: "under-graduate", title: "管理系统" },
		{ icon: "under-graduate", title: "管理系统" },
		{ icon: "under-graduate", title: "管理系统" },
		{ icon: "under-graduate", title: "管理系统" },
		{ icon: "under-graduate", title: "管理系统" },
	];

	function getDateString() {
		return new Date().toLocaleDateString("zh-CN", {
			hour12: false,
			year: "numeric",
			month: "long",
			day: "numeric",
			weekday: "long",
		});
	}
</script>

<template>
	<ElSpace
		direction="vertical"
		:size="20"
	>
		<ElCard class="base">
			<ElContainer>
				<ElHeader style="height: max-content">
					<ElContainer>
						<ElAside>
							<ElAvatar :src="userInfo.avatar" />
						</ElAside>
						<ElMain>
							<p class="welcome">
								<span v-if="new Date().getHours() < 12">上午好! </span>
								<span v-else-if="new Date().getHours() < 18">下午好! </span>
								<span v-else>下午好! </span>
								<span>{{ userInfo.name }}. 今天是 {{ getDateString() }}</span>
							</p>
						</ElMain>
					</ElContainer>
				</ElHeader>
				<ElMain class="entrance">
					<ElRow>
						<ElCol
							v-for="item in quickEntrance"
							:span="5"
						>
							<IconFont :value="item.icon" />
							<span>{{ item.title }}</span>
						</ElCol>
					</ElRow>
				</ElMain>
			</ElContainer>
		</ElCard>
		<ElCard>
			<template #header>
				<span>待办事项</span>
				<ElLink>
					<span>更多</span>
					<IconFont value="external-link" />
				</ElLink>
			</template>
			<p class="empty">暂无待办事项</p>
		</ElCard>
	</ElSpace>
</template>

<style scoped lang="css">
	.el-space {
		width: 100%;
		height: 100%;
		padding: 1em 2em 2em;
		box-sizing: border-box;
	}

	.el-space :deep(.el-space__item) {
		width: 100%;
	}

	.el-card :deep(.el-card__header .el-link) {
		float: right;
	}
	.el-card .el-link span {
		margin-right: 0.5em;
	}

	.el-card .el-main {
		padding: 0 var(--el-main-padding);
	}

	.el-card.base .el-aside {
		--el-aside-width: 5em;
	}
	.el-card.base .el-avatar {
		width: 5em;
		height: 5em;
	}

	.el-card.base .welcome {
		font-size: 20px;
	}
	.el-card.base .entrance {
		margin-top: 2em;
		border-top: 1px solid var(--el-border-color);
	}

	.entrance .el-row {
		padding-top: 2em;
		flex-wrap: nowrap;
		overflow: auto;
	}
	.entrance .el-row::-webkit-scrollbar {
		display: none;
	}

	.entrance .el-row .el-col {
		padding: 0 2em;
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		min-width: max-content;
		cursor: pointer;
	}

	.entrance .el-row :deep(.el-col:not(:last-of-type)) {
		border-right: 1px solid var(--el-border-color);
	}

	.entrance :deep(.iconfont) {
		font-size: 60px;
		line-height: 1.2em;
	}

	p.empty {
		text-align: center;
		opacity: 0.7;
	}
</style>
