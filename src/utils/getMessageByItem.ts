import { parseKey } from "./parseKey";
import { parseValue } from "./parseValue";

export function getMessageByItem(item: Record<string, string | number>) {
	return Object.entries(item)
		.map(([key, value]) => {
			if (key === 'id') {
				return;
			}
			if (!value) {
				return;
			}

			return `${parseKey(key, value)}: **${parseValue(key, value)}**`
		})
		.filter((v) => !!v)
		.join('\n');
}
