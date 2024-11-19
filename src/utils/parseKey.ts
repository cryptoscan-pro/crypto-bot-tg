export function parseKey(key: string, value: string | number) {
	if (key === 'spread' && typeof value === 'number' && value < 0) {
		return `📉${key}`
	}
	if (key === 'spread' && typeof value === 'number' && value >= 0) {
		return `📈${key}`
	}
	if (key === 'liquidity' && typeof value === 'number' && value < 100000) {
		return `📕${key}`
	}
	if (key === 'liquidity' && typeof value === 'number' && value < 500000) {
		return `📒${key}`
	}
	if (key === 'liquidity' && typeof value === 'number' && value < 1000000) {
		return `📗${key}`
	}
	return key
}
