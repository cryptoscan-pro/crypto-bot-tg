import { Markup } from "telegraf";
import { getDataTypes } from "./getData";
import { chunk } from "./chunk";

export async function startNewStep(ctx) {
    const dataTypes = await getDataTypes();
    const typeButtons = dataTypes.map(type => Markup.button.callback(type, `type_${type}`));
    const typeKeyboard = typeButtons.length > 3 ? chunk(typeButtons, 3) : [typeButtons];
    await ctx.reply("Выберите тип данных:", Markup.inlineKeyboard(typeKeyboard));
}
