export function parseObjectValues(obj: { [key: string]: any }): { [key: string]: number | string } {
  const parsedObj: { [key: string]: number | string } = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      const parsedValue = isNaN(Number(value)) ? value : Number(value);
      parsedObj[key] = parsedValue;
    }
  }

  return parsedObj;
}
