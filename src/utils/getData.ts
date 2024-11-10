import { API_URL } from "./constants";

export async function getData(query: Record<string, string>) {
	console.log(query)
	return fetch(API_URL + "?" + new URLSearchParams(query))
		.then(async (res) => {
			if (!res.ok) {
				throw new Error(await res.text());
			}

			return res;
		})
		.then((res) => res.json())
		.then((res) => res.data)
}
