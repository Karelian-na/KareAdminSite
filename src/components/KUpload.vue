<!-- @format -->
<script setup lang="ts">
	import type { IPreviewDialogProps } from "@/common";
	import type { Arrayable, Optional } from "@/common/utils";
	import type { UploadProps, UploadRequestHandler, UploadUserFile } from "element-plus";

	import IconFont from "./IconFont.vue";
	import { ElUpload, genFileId, ElButton, UploadFile } from "element-plus";

	import { EmptyObject } from "@/common/utils";
	import { error } from "@/common/utils/Interactive";
	import { onBeforeMount, ref, useAttrs, watch } from "vue";
	import { AxiosRequestOption, uploadFile } from "@/common/utils/Network";

	type KUploadFileItem =
		| UploadUserFile
		| {
				name: string;
				url: string;
		  };

	const props = defineProps<{
		type: "file" | "image";
		disabled?: boolean;
		autoUploadWhenSubmit?: boolean;
		modelValue: Arrayable<string>;
		imagePrevDialogProps?: IPreviewDialogProps;
	}>();
	const $attrs = useAttrs();

	const emits = defineEmits<{
		(e: "update:modelValue", value?: Arrayable<string>): void;
	}>();

	let uploadPromise: Optional<Promise<any>>;
	const fileList = new Array<UploadFile>();

	const tempImageSrc = ref<string>("");
	const internalModelValue = ref(mapInternalModelValue());

	const uploadIns = ref<InstanceType<typeof ElUpload>>(EmptyObject);

	defineExpose({ upload: uploadFiles });

	onBeforeMount(() => {
		if (props.type === "image") {
			if (!props.modelValue || typeof props.modelValue === "string") {
				tempImageSrc.value = props.modelValue;
			} else if (undefined !== props.modelValue) {
				tempImageSrc.value = props.modelValue[0];
				console.warn("upload type of image's modelValue should be a string! current value is:", props.modelValue);
			}
		} else {
			if (props.modelValue && !Array.isArray(props.modelValue)) {
				console.error("upload type of file's modelValue must be a string array! current value is:", props.modelValue);
			}
		}
	});

	watch(
		() => props.modelValue,
		() => {
			internalModelValue.value = mapInternalModelValue();
		}
	);

	const onUploadExceed: UploadProps["onExceed"] = function (files: File[], uploadFiles: UploadUserFile[]) {
		if (uploadIns.value.$props.limit === 1 || props.type === "image") {
			uploadIns.value.clearFiles();
			const file = files[0] as unknown as UploadUserFile;
			file.uid = genFileId();
			uploadIns.value.handleStart(file as any);
		} else if (uploadIns.value.$props.limit) {
			error("msg", { message: `最多只能上传${uploadIns.value.$props.limit}个附件!` });
		}
	};

	const onUploadChange: UploadProps["onChange"] = function (uploadFile, uploadFiles) {
		switch (uploadFile.status) {
			case "ready": {
				if (props.type === "image") {
					if (tempImageSrc.value && tempImageSrc.value.startsWith("blob")) {
						URL.revokeObjectURL(tempImageSrc.value);
					}
					tempImageSrc.value = URL.createObjectURL(uploadFile.raw as File);

					emits("update:modelValue", "__" + uploadFile.uid.toString());
				} else {
					const value = Array.isArray(props.modelValue) ? props.modelValue : [];
					value.push("__" + uploadFile.uid.toString());
					emits("update:modelValue", value);
				}
				fileList.reset(uploadFiles);
				break;
			}
			case "success": {
				if (!uploadFile.response || !Array.isArray(uploadFile.response)) {
					break;
				}

				const file = uploadFile.response[0] as string;
				if (props.type === "file" && Array.isArray(props.modelValue)) {
					const value = props.modelValue ?? [];
					value.push(file);
					emits("update:modelValue", value);
				} else {
					emits("update:modelValue", file);
				}
				uploadPromise = undefined;
				break;
			}
			default:
				break;
		}
	};

	const onUpload: UploadRequestHandler = function (options) {
		uploadPromise = uploadFile(options.file);
		return uploadPromise;
	};

	const onRemoveFile: UploadProps["onRemove"] = function (uploadFile, uploadFiles) {
		if (!Array.isArray(props.modelValue)) {
			emits("update:modelValue", "");

			if (tempImageSrc.value!.startsWith("blob")) {
				URL.revokeObjectURL(tempImageSrc.value!);
			}
			tempImageSrc.value = "";
			return;
		}

		let fileName = "";
		if (Array.isArray(uploadFile.response)) {
			fileName = uploadFile.response[0] as string;
		} else if (uploadFile.raw) {
			fileName = "__" + uploadFile.uid.toString();
		} else {
			fileName = uploadFile.url!;
		}

		const idx = props.modelValue.findIndex((item) => item === fileName);
		if (-1 !== idx) {
			props.modelValue?.remove(idx);
		}
		return;
	};

	const onRemoveIconClock: typeof uploadIns.value.handleRemove = function (file) {
		uploadIns.value.handleRemove(file ?? internalModelValue.value[0]);
	};

	async function uploadFiles(extraOptions?: AxiosRequestOption["extraOptions"]) {
		if ($attrs.autoUpload || !internalModelValue.value.length) {
			if (uploadPromise) {
				await uploadPromise;
			}
			return props.modelValue ?? true;
		}

		const uploadingFiles = new Array<UploadUserFile>();
		const uploadedFiles = new Array<string>();

		internalModelValue.value.forEach((item) => {
			if (Object.hasOwn(item, "raw")) {
				uploadingFiles.push(item);
			} else {
				uploadedFiles.push(item.url!);
			}
		});

		if (uploadingFiles.length === 0) {
			return true;
		}

		const urls = await uploadFile(uploadingFiles, extraOptions);
		if (!urls) {
			return false;
		}
		return urls.concat(uploadedFiles);
	}

	function mapInternalModelValue(): Array<KUploadFileItem> {
		const value = Array.isArray(props.modelValue) ? props.modelValue : props.modelValue ? [props.modelValue] : [];
		const uploadedFiles: Array<KUploadFileItem> = value
			.filter((item) => !item.startsWith("__"))
			.map((item) => ({
				name: item.substring(item.lastIndexOf("/") + 1),
				url: item,
			}));

		return uploadedFiles.concat(fileList);
	}

	function onPreviewImageIconClick() {
		if (!props.imagePrevDialogProps) {
			return;
		}

		props.imagePrevDialogProps.src = tempImageSrc.value!;
		props.imagePrevDialogProps.show = true;
	}
</script>

<template>
	<ElUpload
		ref="uploadIns"
		class="ao-upload"
		:class="type"
		v-model:file-list="internalModelValue"
		:disabled="disabled"
		:auto-upload="false"
		:http-request="onUpload"
		@change="onUploadChange"
		@exceed="onUploadExceed"
		@remove="onRemoveFile"
		v-bind="$attrs"
	>
		<!-- image-mode -->
		<template v-if="type == 'image'">
			<template v-if="tempImageSrc">
				<img :src="tempImageSrc" />
				<span
					class="actions"
					@click.stop="null"
				>
					<IconFont
						value="enlarge"
						@click="onPreviewImageIconClick"
					/>
					<IconFont
						v-if="!disabled"
						value="delete"
						@click="onRemoveIconClock"
					/>
				</span>
			</template>
			<span v-else-if="disabled">暂未设置</span>
			<IconFont
				v-else
				value="add"
			/>
		</template>

		<!-- file-mode -->
		<template
			v-if="type == 'file' && !disabled"
			#trigger
		>
			<ElButton type="primary">选择文件</ElButton>
		</template>
		<template
			v-if="type == 'file'"
			#file="{ file }"
		>
			<IconFont value="menu" />
			<span
				v-if="file.name.startsWith('__')"
				class="upload-item-name"
			>
				{{ file.name }}
			</span>
			<a
				v-else
				target="__blank"
				class="upload-item-name"
				:href="file.url"
				>{{ file.name }}</a
			>
			<IconFont
				v-if="!disabled"
				value="delete"
				@click="onRemoveIconClock(file)"
			/>
		</template>
	</ElUpload>
</template>

<style scoped>
	.ao-upload.image {
		height: 10em;
		width: 10em;
	}

	.ao-upload.image :deep(.el-upload) {
		border: 1px dashed var(--el-border-color);
		border-radius: 6px;
		cursor: pointer;
		position: relative;
		overflow: hidden;
		width: 100%;
		height: 100%;
		transition: var(--el-transition-duration-fast);
	}
	.ao-upload.image :deep(.el-upload:hover) {
		border-color: var(--el-color-primary);
	}
	.ao-upload.file :deep(.el-upload) {
		flex-direction: column;
		justify-self: flex-start;
		align-items: flex-start;
	}
	:global(.ao-upload.file .el-upload.is-disabled),
	:global(.details .ao-upload.file .el-upload) {
		display: none;
	}

	:global(.details .ao-upload.file .el-upload-list) {
		margin-top: 0.5em;
	}
	.ao-upload.file :deep(.el-upload-list__item) {
		line-height: 1.5;
	}
	.ao-upload.file :deep(.el-upload-list__item .icon-delete) {
		cursor: pointer;
		float: right;
		display: none;
	}
	.ao-upload.file :deep(.el-upload-list__item:hover .icon-delete) {
		display: initial;
	}
	.ao-upload .upload-item-name {
		margin-left: 0.5em;
	}

	.ao-upload :deep(.icon-add) {
		font-size: 25px;
		color: #8c939d;
		text-align: center;
	}

	.ao-upload .actions {
		position: absolute;
		width: 100%;
		height: 100%;
		left: 0;
		top: 0;
		cursor: default;
		display: inline-flex;
		justify-content: space-evenly;
		align-items: center;
		color: #fff;
		opacity: 0;
		font-size: 20px;
		background-color: var(--el-overlay-color-lighter);
		transition: opacity var(--el-transition-duration);
	}
	.ao-upload .actions:hover {
		opacity: 1;
	}

	.ao-upload .actions :deep(.iconfont) {
		cursor: pointer;
	}

	.ao-upload img {
		width: 100%;
		height: 100%;
		margin: auto;
	}
</style>
