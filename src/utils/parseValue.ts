import { BigNumber } from "bignumber.js";
import { getBigNumber } from "./getBigNumber";
import { getAgo } from "./getAgo";

export function parseValue(key: string, value: string | number) {
	if (key.toLowerCase().includes('change') && !key.toLowerCase().includes('exchange')) {
		return `${new BigNumber(value).toFixed(2)}%`;
	}
	if (key.toLowerCase().includes('volume')) {
		return `$${getBigNumber(Number(value))}`;
	}
	if (key.toLowerCase().includes('liquidity')) {
		return `$${getBigNumber(Number(value))}`;
	}
	if (key.toLowerCase().includes('price')) {
		return `$${new BigNumber(value).toFixed()}`;
	}
	if (key.toLowerCase().includes('fee')) {
		return `$${new BigNumber(Number(value)).toFixed()}`;
	}
	if (key.toLowerCase().includes('symbol')) {
		return `$${value}`;
	}
	if (key.toLowerCase().includes('createdat')) {
		return getAgo(new Date(Number(value)));
	}

	return value;
}
