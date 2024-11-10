import "dotenv/config";
import { bot, CLIENTS_FILE_PATH, telegramQueue } from "./utils/constants";
import { startWebsocketListening } from "./services/startWebsocketListening";
import { startHttpListening } from "./services/startHttpListening";
import { LimitedSet } from "./utils/LimitedSet";
import FileMap from "@javeoff/file-map";
import { Markup } from "telegraf";
import { getDataTypes, getTypeColumns } from "./utils/getData";
import { chunk } from "./utils/chunk";
import { askContinueOrSave } from "./utils/askContinueOrSave";
import { getMessageByItem } from "./utils/getMessageByItem";

export const CLIENTS = new FileMap(CLIENTS_FILE_PATH);
const historyIds = new LimitedSet(20);

let start = (id: string, query: Record<string, string>) => { };
let stop = (id: string) => { };
let listen = (id: string, onData: (data: any) => void) => { };

if (process.env.WEBSOCKET === '1') {
    const result = startWebsocketListening();
    start = result.start;
    stop = result.stop;
    listen = result.listen;
}
if (process.env.WEBSOCKET !== '1') {
    const result = startHttpListening();
    start = result.start;
    stop = result.stop;
    listen = result.listen;
}

bot.command('add', async (ctx) => {
    const userId = String(ctx.from.id);
    let query: Record<string, string | number> = {};

    const dataTypes = await getDataTypes();
    const typeButtons = dataTypes.map(type => Markup.button.callback(type, `type_${type}`));
    const typeKeyboard = typeButtons.length > 3 ? chunk(typeButtons, 3) : [typeButtons];
    await ctx.reply("Select data type:", Markup.inlineKeyboard(typeKeyboard));

    bot.action(new RegExp(`^type_(.*)$`), async (ctx) => {
        const selectedType = ctx.match[1];
        query['type'] = selectedType;
        const columns = await getTypeColumns(selectedType);
        const columnButtons = columns.map(col => Markup.button.callback(col, `column_${col}`));
        const columnKeyboard = columnButtons.length > 3 ? chunk(columnButtons, 3) : [columnButtons];
        await ctx.reply("Select a field for filtering or sorting:", Markup.inlineKeyboard(columnKeyboard));

        bot.action(new RegExp(`^column_(.*)$`), async (ctx) => {
            const selectedColumn = ctx.match[1];
            const actions = [
                Markup.button.callback("Сортировка по убыванию", `sort_desc_${selectedColumn}`),
                Markup.button.callback("Сортировка по возрастанию", `sort_asc_${selectedColumn}`),
                Markup.button.callback("Фильтр по min", `filter_min_${selectedColumn}`),
                Markup.button.callback("Фильтр по max", `filter_max_${selectedColumn}`),
                Markup.button.callback("Изменение %", `includes_${selectedColumn}`)
            ];
            const actionsKeyboard = chunk(actions, 2);
            await ctx.reply("Select an action:", Markup.inlineKeyboard(actionsKeyboard));

            bot.action(new RegExp(`^sort_desc_(.*)$`), async (ctx) => {
                const column = ctx.match[1];
                query[`sort[${column}]`] = "desc";
                CLIENTS.set(userId, query);
                await ctx.reply(`Sorting by ${column} in descending order set.`);
                await askContinueOrSave(ctx, userId, query);
            });

            bot.action(new RegExp(`^sort_asc_(.*)$`), async (ctx) => {
                const column = ctx.match[1];
                query[`sort[${column}]`] = "asc";
                CLIENTS.set(userId, query);
                await ctx.reply(`Sorting by ${column} in ascending order set.`);
                await askContinueOrSave(ctx, userId, query);
            });

            bot.action(new RegExp(`^filter_min_(.*)$`), async (ctx) => {
                const column = ctx.match[1];
                await ctx.reply(`Enter the minimum value for filtering by ${column}:`);
                bot.on('text', async (msgCtx) => {
                    if (msgCtx.chat.id === ctx.chat.id) {
                        const minValue = msgCtx.message.text;
                        query[`min${capitalizeFirstLetter(column)}`] = minValue;
                        CLIENTS.set(userId, query);
                        await ctx.reply(`Minimum value for ${column} set: ${minValue}.`);
                        await askContinueOrSave(ctx, userId, query);
                    }
                });
            });

            bot.action(new RegExp(`^filter_max_(.*)$`), async (ctx) => {
                const column = ctx.match[1];
                await ctx.reply(`Enter the maximum value for filtering by ${column}:`);
                bot.on('text', async (msgCtx) => {
                    if (msgCtx.chat.id === ctx.chat.id) {
                        const maxValue = msgCtx.message.text;
                        query[`max${capitalizeFirstLetter(column)}`] = maxValue;
                        CLIENTS.set(userId, query);
                        await ctx.reply(`Maximum value for ${column} set: ${maxValue}.`);
                        await askContinueOrSave(ctx, userId, query);
                    }
                });
            });

            bot.action(new RegExp(`^includes_(.*)$`), async (ctx) => {
                const column = ctx.match[1];
                const changeActions = [
                    Markup.button.callback("Изменение за 5 секунд", `change5s_${column}`),
                    Markup.button.callback("Изменение за 10 секунд", `change10s_${column}`),
                    Markup.button.callback("Изменение за 15 секунд", `change15s_${column}`),
                    Markup.button.callback("Изменение за 30 секунд", `change30s_${column}`),
                    Markup.button.callback("Изменение за 1 минуту", `change1m_${column}`),
                    Markup.button.callback("Изменение за 1 час", `change1h_${column}`)
                ];
                const changeActionsKeyboard = chunk(changeActions, 2);
                await ctx.reply("Select the period of change in percentage:", Markup.inlineKeyboard(changeActionsKeyboard));

                bot.action(new RegExp(`^change(.*)_(.*)$`), async (ctx) => {
                    const [time, column] = [ctx.match[1], ctx.match[2]];
                    const changeField = `${column}Change${time}`;
                    query[`includes[${column}]`] = `change${time}`;
                    CLIENTS.set(userId, query);

                    const filterActions = [
                        Markup.button.callback(`Фильтр min ${changeField}`, `filter_min_${changeField}`),
                        Markup.button.callback(`Фильтр max ${changeField}`, `filter_max_${changeField}`)
                    ];
                    const filterActionsKeyboard = chunk(filterActions, 2);
                    await ctx.reply(`Change by ${changeField} added. Select a filter:`, Markup.inlineKeyboard(filterActionsKeyboard));

                    bot.action(new RegExp(`^filter_min_${changeField}$`), async (ctx) => {
                        await ctx.reply(`Enter the minimum value for filtering by ${changeField}:`);
                        bot.on('text', async (msgCtx) => {
                            if (msgCtx.chat.id === ctx.chat.id) {
                                const minValue = msgCtx.message.text;
                                query[`min${capitalizeFirstLetter(changeField)}`] = minValue;
                                CLIENTS.set(userId, query);
                                await ctx.reply(`Minimum value for ${changeField} set: ${minValue}.`);
                                await askContinueOrSave(ctx, userId, query);
                            }
                        });
                    });

                    bot.action(new RegExp(`^filter_max_${changeField}$`), async (ctx) => {
                        await ctx.reply(`Enter the maximum value for filtering by ${changeField}:`);
                        bot.on('text', async (msgCtx) => {
                            if (msgCtx.chat.id === ctx.chat.id) {
                                const maxValue = msgCtx.message.text;
                                query[`max${capitalizeFirstLetter(changeField)}`] = maxValue;
                                CLIENTS.set(userId, query);
                                await ctx.reply(`Maximum value for ${changeField} set: ${maxValue}.`);
                                await askContinueOrSave(ctx, userId, query);
                            }
                        });
                    });
                });
            });
        });
    });
});

function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

bot.launch(() => {
    CLIENTS.forEach((query, userId) => {
        start(userId, query);
				listen(userId, (data) => {
					telegramQueue.add(async () => {
						bot.telegram.sendMessage(userId, getMessageByItem(data));				
					})
				})
    });
});

