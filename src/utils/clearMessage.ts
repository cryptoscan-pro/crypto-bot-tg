import telegramify from "telegramify-markdown";

export const clearMessage = (text: string) => {
  return telegramify(text).replaceAll('-', '\\-');
}
