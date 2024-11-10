import "dotenv/config";
import { bot, CLIENTS_FILE_PATH } from "./utils/constants";
import { startWebsocketListening } from "./services/startWebsocketListening";
import { startHttpListening } from "./services/startHttpListening";
import { LimitedSet } from "./utils/LimitedSet";
import FileMap from "@javeoff/file-map";
import { Markup } from "telegraf";
import { getDataTypes, getTypeColumns } from "./utils/getData";
import { chunk } from "./utils/chunk";
import { askContinueOrSave } from "./utils/askContinueOrSave";

const CLIENTS = new FileMap(CLIENTS_FILE_PATH);
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
    let query: Record<string, string> = {};

    const dataTypes = await getDataTypes();
    const typeButtons = dataTypes.map(type => Markup.button.callback(type, `type_${type}`));
    const typeKeyboard = typeButtons.length > 3 ? chunk(typeButtons, 3) : [typeButtons];
    await ctx.reply("Select data type:", Markup.inlineKeyboard(typeKeyboard));

    bot.action(/^type_(.*)$/, async (ctx) => {
        const selectedType = ctx.match[1];
        query['type'] = selectedType;
        const columns = await getTypeColumns(selectedType);
        const columnButtons = columns.map(col => Markup.button.callback(col, `column_${col}`));
        const columnKeyboard = columnButtons.length > 3 ? chunk(columnButtons, 3) : [columnButtons];
        await ctx.reply("Select a field for filtering or sorting:", Markup.inlineKeyboard(columnKeyboard));

        bot.action(/^column_(.*)$/, async (ctx) => {
            const selectedColumn = ctx.match[1];
            const actions = [
                Markup.button.callback("Сортировка min", `sort_min_${selectedColumn}`),
                Markup.button.callback("Сортировка max", `sort_max_${selectedColumn}`),
                Markup.button.callback("Фильтр", `filter_${selectedColumn}`),
                Markup.button.callback("Изменение %", `includes_${selectedColumn}`)
            ];
            const actionsKeyboard = actions.length > 2 ? chunk(actions, 2) : [actions];
            await ctx.reply("Select an action:", Markup.inlineKeyboard(actionsKeyboard));

            bot.action(/^sort_min_(.*)$/, async (ctx) => {
                const column = ctx.match[1];
                await ctx.reply(`Enter the minimum value for sorting by ${column}:`);
                bot.once('text', async (msgCtx) => {
                    if (msgCtx.chat.id === ctx.chat.id) {
                        const minValue = msgCtx.message.text;
                        query[`sort[${column}]`] = { min: minValue };
                        CLIENTS.set(userId, query);
                        await ctx.reply(`Minimum sorting by ${column} set to ${minValue}.`);
                        await askContinueOrSave(ctx, userId, query);
                    }
                });
            });

            bot.action(/^sort_max_(.*)$/, async (ctx) => {
                const column = ctx.match[1];
                await ctx.reply(`Enter the maximum value for sorting by ${column}:`);
                bot.once('text', async (msgCtx) => {
                    if (msgCtx.chat.id === ctx.chat.id) {
                        const maxValue = msgCtx.message.text;
                        query[`sort[${column}]`] = { max: maxValue };
                        CLIENTS.set(userId, query);
                        await ctx.reply(`Maximum sorting by ${column} set to ${maxValue}.`);
                        await askContinueOrSave(ctx, userId, query);
                    }
                });
            });

            bot.action(/^filter_(.*)$/, async (ctx) => {
                const column = ctx.match[1];
                await ctx.reply(`Enter a value for filtering by ${column}:`);
                bot.once('text', async (msgCtx) => {
                    if (msgCtx.chat.id === ctx.chat.id) {
                        const filterValue = msgCtx.message.text;
                        query[column] = filterValue;
                        CLIENTS.set(userId, query);
                        await ctx.reply(`Filter by ${column} set to ${filterValue}.`);
                        await askContinueOrSave(ctx, userId, query);
                    }
                });
            });

            bot.action(/^includes_(.*)$/, async (ctx) => {
                const column = ctx.match[1];
                const changeActions = [
                    Markup.button.callback("Изменение за 5 секунд", `change5s_${column}`),
                    Markup.button.callback("Изменение за 10 секунд", `change10s_${column}`),
                    Markup.button.callback("Изменение за 15 секунд", `change15s_${column}`),
                    Markup.button.callback("Изменение за 30 секунд", `change30s_${column}`),
                    Markup.button.callback("Изменение за 1 минуту", `change1m_${column}`),
                    Markup.button.callback("Изменение за 1 час", `change1h_${column}`)
                ];
                const changeActionsKeyboard = changeActions.length > 2 ? chunk(changeActions, 2) : [changeActions];
                await ctx.reply("Select change time (in percentage):", Markup.inlineKeyboard(changeActionsKeyboard));

                bot.action(/^change(.*)_(.*)$/, async (ctx) => {
                    const [time, column] = [ctx.match[1], ctx.match[2]];
                    const changeField = `${column}Change${time}`;
                    query[`includes[${column}]`] = `change${time}`;
                    query[`sort[${changeField}]`] = "desc"; // Добавляем сортировку по изменению
                    CLIENTS.set(userId, query);

                    await ctx.reply(`You selected change over ${time} for field ${column}.`);
                    await askContinueOrSave(ctx, userId, query);
                });
            });
        });
    });
});

// Функция для продолжения или сохранения

bot.launch(() => {
    CLIENTS.forEach((query, userId) => {
        start(userId, query);
    });
});
