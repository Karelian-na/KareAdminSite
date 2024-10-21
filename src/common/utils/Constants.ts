/** @format */

export namespace Constants {
	export const commonUserRole = 9;
	export const adminRole = 2;

	export const externalLinkRegex = new RegExp(
		"^(https?:\\/\\/)?" + // protocol
			"((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|" + // domain name
			"((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
			"(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
			"(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
			"(\\#[-a-z\\d_]*)?$",
		"i"
	);

	export const nonEditableFieldRegex = /^(?:(?:(?:add|update)_(?:uid|user|time))|id)$/;
}
