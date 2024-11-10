import { parseValue } from "./parseValue";

export function getMessageByItem(item: Record<string, string | number>) {
	return Object.entries(item)
		.map(([key, value]) => {
			if (!value) {
				return;
			}

			return `${key}: ${parseValue(key, value)}`
		})
		.filter((v) => !!v)
		.join('\n');
}
