<!-- @format -->

<script setup lang="ts">
	import { useRouter } from "vue-router";

	import KButton from "@/components/KButton.vue";

	const router = useRouter();

	function goHome() {
		router.replace({ name: "home" });
	}
</script>

<template>
	<div class="error-404-container">
		<div class="robot-anim-box crash">
			<svg
				class="robot-svg"
				xmlns="http://www.w3.org/2000/svg"
			>
				<g>
					<rect
						x="10"
						y="140"
						width="28"
						height="12"
						rx="6"
						transform="rotate(-30 0 140)"
					>
						<animateTransform
							attributeName="transform"
							type="rotate"
							values="-30 0 140; -40 0 140; -30 0 140"
							dur="1.2s"
							repeatCount="indefinite"
						/>
					</rect>
					<circle
						cx="-5"
						cy="146"
						r="8"
					/>
					<rect
						x="132"
						y="80"
						width="28"
						height="12"
						rx="6"
						transform="rotate(30 132 80)"
					>
						<animateTransform
							attributeName="transform"
							type="rotate"
							values="30 132 80; 40 132 80; 30 132 80"
							dur="1.2s"
							repeatCount="indefinite"
						/>
					</rect>
					<circle
						cx="164"
						cy="86"
						r="8"
					/>
					<!-- 身体 -->
					<rect
						x="40"
						y="60"
						width="80"
						height="80"
						rx="20"
						stroke-width="4"
					/>
					<rect
						x="55"
						y="140"
						width="20"
						height="40"
						rx="8"
					/>
					<rect
						x="85"
						y="140"
						width="20"
						height="40"
						rx="8"
					/>
					<g transform="rotate(-18 80 50)">
						<circle
							cx="80"
							cy="50"
							r="28"
							stroke-width="4"
						/>
						<g
							stroke-width="3"
							stroke-linecap="round"
						>
							<line
								x1="70"
								y1="44"
								x2="76"
								y2="56"
							/>
							<line
								x1="76"
								y1="44"
								x2="70"
								y2="56"
							/>
							<line
								x1="90"
								y1="44"
								x2="96"
								y2="56"
							/>
							<line
								x1="96"
								y1="44"
								x2="90"
								y2="56"
							/>
						</g>
						<path
							d="M72 66 Q80 72 88 66"
							stroke-width="3"
							fill="none"
						/>
					</g>
					<polyline
						points="80,10 85,25 75,25 80,40"
						fill="none"
						stroke="#f7c948"
						stroke-width="4"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<animate
							attributeName="points"
							values="80,10 85,25 75,25 80,40;80,14 87,25 73,25 80,40;80,10 85,25 75,25 80,40"
							dur="1.2s"
							repeatCount="indefinite"
						/>
					</polyline>
					<rect
						x="60"
						y="100"
						width="40"
						height="10"
						rx="5"
					/>
				</g>
			</svg>
		</div>
		<div class="content">
			<div class="error-code">404</div>
			<div class="error-title">页面未找到</div>
			<div class="error-desc">抱歉，您访问的页面不存在或已被删除。</div>
			<KButton
				type="primary"
				class="error-operation"
				@click="goHome"
				>返回首页
			</KButton>
		</div>
	</div>
</template>

<style scoped lang="css">
	.error-404-container {
		height: inherit;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--background-color);
		flex-direction: row;
	}
	.robot-anim-box {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 15em;
	}
	.robot-svg {
		width: 160px;
		height: 200px;
		display: block;
		fill: var(--primary-color);
		stroke: var(--contrasted-text-color);
	}

	.content {
		text-align: center;
		padding: 3em 2em;
		border-radius: 16px;
	}
	.error-code {
		font-size: 6em;
		font-weight: bold;
		color: var(--primary-color);
		margin-bottom: 0.2em;
		letter-spacing: 0.1em;
	}
	.error-title {
		font-size: 2em;
		font-weight: 500;
		margin-bottom: 0.5em;
	}
	.error-desc {
		margin-bottom: 2em;
	}
	.error-operation {
		font-size: 1.1em;
		padding: 0.8em 2.5em;
	}
</style>
