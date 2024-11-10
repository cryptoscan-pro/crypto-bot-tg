import pMemoize from "p-memoize";
import { API_URL } from "./constants";

export async function getData(query: Record<string, string>) {
	return fetch(API_URL + "?" + new URLSearchParams(query))
		.then(async (res) => {
			if (!res.ok) {
				throw new Error(await res.text());
			}

			return res;
		})
		.then((res) => res.json())
		.then((res) => res.data)
		.catch((e) => {
			console.error(e)
			return [];
		})
}

export const getDataTypes = pMemoize(async (): Promise<string[]> => {
	console.log('Loading data types')
	const query = { slice: 'type' };
	return fetch(API_URL + "?" + new URLSearchParams(query))
		.then(async (res) => {
			if (!res.ok) {
				throw new Error(await res.text());
			}

			return res;
		})
		.then((res) => res.json())
		.then((res) => Object.keys(res.slice))
		.catch((e) => {
			console.error(e)
			return [];
		})
})

export const getTypeColumns = pMemoize(async (type: string): Promise<string[]> => {
	const query = { type };
	return fetch(API_URL + "?" + new URLSearchParams(query))
		.then(async (res) => {
			if (!res.ok) {
				throw new Error(await res.text());
			}

			return res;
		})
    .then((res) => res.json())
    .then((res) => Object.keys(res.data[0]))
    .catch((e) => {
      console.error(e)
      return [];
    })
})
