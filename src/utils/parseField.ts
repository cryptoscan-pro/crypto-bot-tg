import { BigNumber } from "bignumber.js";
import { getBigNumber } from "./getBigNumber";

export const parseValue = (key: string, value: string | number) => {
	if (key.toLowerCase().includes('change')) {
    return `${new BigNumber(value).toFixed(2)}%`;
	}
	if (key.toLowerCase().includes('volume')) {
		return `$${getBigNumber(Number(value))}`;
	}
	if (key.toLowerCase().includes('price')) {
    return `$${new BigNumber(Number(value).toFixed())}`;
  }
	if (key.toLowerCase().includes('fee')) {
    return `$${new BigNumber(Number(value)).toFixed()}`;
  }
	if (key.toLowerCase().includes('symbol')) {
		return `$${value}`
  }

	return value;
}
