import "dotenv/config";
import { bot, CLIENTS_FILE_PATH, telegramQueue } from "./utils/constants";
import { listWebsockets, manageWebsocket } from './commands/websocket';
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

bot.start(async (ctx) => {
  await ctx.reply(
    'Выберите действие:',
    Markup.inlineKeyboard([
      [Markup.button.callback('📋 Список отслеживаний', 'list_websockets')],
      [Markup.button.callback('➕ Добавить новое отслеживание', 'create_websocket')]
    ])
  );

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
				Markup.button.callback("Sort Descending", `sort_desc_${selectedColumn}`),
				Markup.button.callback("Sort Ascending", `sort_asc_${selectedColumn}`),
				Markup.button.callback("Filter Min", `filter_min_${selectedColumn}`),
				Markup.button.callback("Filter Max", `filter_max_${selectedColumn}`),
				Markup.button.callback("Change %", `includes_${selectedColumn}`)
			];
			const actionsKeyboard = chunk(actions, 2);
			await ctx.reply("Select an action:", Markup.inlineKeyboard(actionsKeyboard));

			bot.action(new RegExp(`^sort_desc_(.*)$`), async (ctx) => {
				const column = ctx.match[1];
				query[`sort[${column}]`] = "desc";
				CLIENTS.set(userId, query);
				await ctx.reply(`Sorting by ${column} in descending order set.`);
				const continueButton = Markup.button.callback("Continue", "continue");
				const saveButton = Markup.button.callback("Save", "save");
			});

			bot.action(new RegExp(`^sort_asc_(.*)$`), async (ctx) => {
				const column = ctx.match[1];
				query[`sort[${column}]`] = "asc";
				CLIENTS.set(userId, query);
				await ctx.reply(`Sorting by ${column} in ascending order set.`);
				await askContinueOrSave(ctx, userId, query as Record<string, string>, start, listen);
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
						await askContinueOrSave(ctx, userId, query as Record<string, string>, start, listen);
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
						await askContinueOrSave(ctx, userId, query, start, listen);
					}
				});
			});

			bot.action(new RegExp(`^includes_(.*)$`), async (ctx) => {
				const column = ctx.match[1];
				const changeActions = [
					Markup.button.callback("Change in 5 seconds", `change5s_${column}`),
					Markup.button.callback("Change in 10 seconds", `change10s_${column}`),
					Markup.button.callback("Change in 15 seconds", `change15s_${column}`),
					Markup.button.callback("Change in 30 seconds", `change30s_${column}`),
					Markup.button.callback("Change in 1 minute", `change1m_${column}`),
					Markup.button.callback("Change in 1 hour", `change1h_${column}`)
				];
				const changeActionsKeyboard = chunk(changeActions, 2);
				await ctx.reply("Select the period of change in percentage:", Markup.inlineKeyboard(changeActionsKeyboard));

				bot.action(new RegExp(`^change(.*)_(.*)$`), async (ctx) => {
					const [time, column] = [ctx.match[1], ctx.match[2]];
					const changeField = `${column}Change${time}`;
					query[`includes[${column}]`] = `change${time}`;
					CLIENTS.set(userId, query);

					const filterActions = [
						Markup.button.callback(`Filter min ${changeField}`, `filter_min_${changeField}`),
						Markup.button.callback(`Filter max ${changeField}`, `filter_max_${changeField}`)
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
								    if (ctx.session?.editingConfig) {
								      // We're editing an existing config
								      const { configId, destination, name } = ctx.session.editingConfig;
								      const configs = CLIENTS.get(userId) || [];
								      const configIndex = configs.findIndex(c => c.id === configId);
          
								      if (configIndex !== -1) {
								        configs[configIndex] = {
								          ...configs[configIndex],
								          query: query
								        };
								        CLIENTS.set(userId, configs);
            
								        // Restart the websocket with new query
								        start(configId, query);
								        listen(configId, createMessageHandler(configs[configIndex]));
            
								        await ctx.reply('Configuration updated successfully!');
								        await listWebsockets(ctx);
								        ctx.session.editingConfig = null;
								      }
								    } else {
								      await askContinueOrSave(ctx, userId, query);
								    }
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

bot.action(/^edit_query_(.+)$/, async (ctx) => {
  const configId = ctx.match[1];
  const userId = String(ctx.from.id);
  const configs = CLIENTS.get(userId) || [];
  const config = configs.find(c => c.id === configId);

  if (!config) {
    await ctx.reply('Configuration not found');
    return;
  }

  // Stop current listening
  stop(configId);

  // Start new parameter selection flow with existing query
  let query = {...config.query};
  const dataTypes = await getDataTypes();
  const typeButtons = dataTypes.map(type => Markup.button.callback(type, `type_${type}`));
  const typeKeyboard = typeButtons.length > 3 ? chunk(typeButtons, 3) : [typeButtons];
  await ctx.reply("Select data type to modify:", Markup.inlineKeyboard(typeKeyboard));

  // Save the existing config details in session
  ctx.session = {
    editingConfig: {
      configId,
      query,
      destination: config.destination,
      name: config.name
    }
  };
});

bot.action('list_websockets', async (ctx) => {
  await listWebsockets(ctx);
});

bot.action('create_websocket', async (ctx) => {
  const userId = String(ctx.from.id);
  telegramQueue.clear();
  stop(userId);
  let query: Record<string, string | number> = {};

  const dataTypes = await getDataTypes();
  const typeButtons = dataTypes.map(type => Markup.button.callback(type, `type_${type}`));
  const typeKeyboard = typeButtons.length > 3 ? chunk(typeButtons, 3) : [typeButtons];
  await ctx.reply("Выберите тип данных:", Markup.inlineKeyboard([
    ...typeKeyboard,
    [Markup.button.callback('« Назад', 'back_to_start')]
  ]));
});

bot.action('back_to_start', async (ctx) => {
  await ctx.reply(
    'Выберите действие:',
    Markup.inlineKeyboard([
      [Markup.button.callback('📋 Список отслеживаний', 'list_websockets')],
      [Markup.button.callback('➕ Добавить новое отслеживание', 'create_websocket')]
    ])
  );
});

bot.action(/^manage_(.+)$/, async (ctx) => {
  const configId = ctx.match[1];
  await manageWebsocket(ctx, configId);
});

bot.action(/^delete_(.+)$/, async (ctx) => {
  const configId = ctx.match[1];
  const userId = String(ctx.from.id);
  const configs = CLIENTS.get(userId) || [];
  const newConfigs = configs.filter(c => c.id !== configId);
  
  stop(configId);
  CLIENTS.set(userId, newConfigs);
  
  await ctx.reply('Конфигурация успешно удалена');
  await listWebsockets(ctx);
});

bot.action(/^toggle_(.+)$/, async (ctx) => {
  const configId = ctx.match[1];
  const userId = String(ctx.from.id);
  const configs = CLIENTS.get(userId) || [];
  const configIndex = configs.findIndex(c => c.id === configId);
  
  if (configIndex !== -1) {
    configs[configIndex].isActive = !configs[configIndex].isActive;
    
    if (configs[configIndex].isActive) {
      start(configId, configs[configIndex].query);
      listen(configId, createMessageHandler(configs[configIndex]));
    } else {
      stop(configId);
    }
    
    CLIENTS.set(userId, configs);
    await manageWebsocket(ctx, configId);
  }
});

function createMessageHandler(config: WebSocketConfig) {
  return (data: any) => {
    telegramQueue.add(async () => {
      const message = getMessageByItem(data.data);
      if (config.destination.type === 'private') {
        await bot.telegram.sendMessage(config.destination.id, message, {
          parse_mode: 'Markdown'
        });
      } else if (config.destination.type === 'channel') {
        await bot.telegram.sendMessage(config.destination.id, message, {
          parse_mode: 'Markdown'
        });
      }
    });
  };
}

bot.launch(() => {
	CLIENTS.forEach((query, userId) => {
		start(userId, query);
		listen(userId, (data) => {
			console.log(data)
			telegramQueue.add(async () => {
				bot.telegram.sendMessage(userId, getMessageByItem(data.data), {
          parse_mode: 'Markdown'
				});
			})
		})
	});
});

