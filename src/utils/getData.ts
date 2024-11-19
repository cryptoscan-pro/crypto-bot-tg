import pMemoize from "p-memoize";
import { API_URL } from "./constants";

interface ApiResponse<T> {
  data: T;
  quota: number;
  slice?: Record<string, unknown>;
}

export async function getData<T = any>(query: Record<string, string>): Promise<T[]> {
  try {
    const response = await fetch(`${API_URL}?${new URLSearchParams(query)}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${errorText}`);
    }

    const result: ApiResponse<T> = await response.json();
    
    if (result.quota === 0) {
      throw new Error('Quota exceeded. Please try again later or buy subscription in https://cryptoscan.pro');
    }

    return result.data;
  } catch (error) {
    console.error('getData error:', error);
    return [];
  }
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
		.then((res) => {
			if (res.quota === 0) {
				throw new Error('Quota exceeded. Please try again later or buy subscription in https://cryptoscan.pro');
			}
			return Object.keys(res.slice)
		})
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
		.then((res) => {
			if (res.quota === 0) {
				throw new Error('Quota exceeded. Please try again later or buy subscription in https://cryptoscan.pro');
			}
			return Object.keys(res.data[0])
		})
    .catch((e) => {
      console.error(e)
      return [];
    })
})
