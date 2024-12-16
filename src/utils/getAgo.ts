export function getAgo(date: Date): string {
	const now = new Date();
	const milliseconds = now.getTime() - date.getTime();

	const intervals: { [key: string]: number } = {
		year: 31536000000,
		month: 2592000000,
		day: 86400000,
		hour: 3600000,
		minute: 60000,
		s: 1000,
		ms: 1,
	};

	for (const [unit, value] of Object.entries(intervals)) {
		const interval = Math.floor(milliseconds / value);
		if (interval >= 1) {
			return `${interval}${unit} ago`;
		}
	}

	return `${milliseconds}ms ago`;
}