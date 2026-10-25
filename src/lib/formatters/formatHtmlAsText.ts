const NAMED_ENTITIES: Record<string, string> = {
	amp: "&",
	lt: "<",
	gt: ">",
	quot: '"',
	apos: "'",
	nbsp: " ",
};

export const formatHtmlAsText = (html: string) =>
	html
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<\/(div|p|li|tr|h[1-6])>/gi, "\n")
		.replace(/<[^>]*>/g, "")
		.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, decodeEntity)
		.split("\n")
		.map((line) => line.replace(/\s+/g, " ").trim())
		.filter(Boolean)
		.join("\n");

function decodeEntity(entity: string, code: string) {
	if (!code.startsWith("#")) {
		return NAMED_ENTITIES[code.toLowerCase()] ?? entity;
	}
	const isHex = code[1].toLowerCase() === "x";
	const point = Number.parseInt(code.slice(isHex ? 2 : 1), isHex ? 16 : 10);
	return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : entity;
}
