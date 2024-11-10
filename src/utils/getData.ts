export async function getData(query: Record<string, string>) {
	console.log(query)
	return fetch("https://api.cryptoscan.pro?" + new URLSearchParams(query))
		.then(async (res) => {
			if (!res.ok) {
				throw new Error(await res.text());
			}

			return res;
		})
		.then((res) => res.json())
		.then((res) => res.data)
}
