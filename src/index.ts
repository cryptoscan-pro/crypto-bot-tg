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
import { capitalizeFirstLetter } from "./utils/formatting"; // Предполагается, что есть утилита для этого
import { generateId } from "./utils/generateId";

export const CLIENTS = new FileMap(CLIENTS_FILE_PATH);
const historyIds = new LimitedSet(20);

let start = (id: string, query: Record<string, string | number>) => { };
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

	// Обработчики действий перемещены сюда, чтобы избежать повторной регистрации
	handleActions();
});

function handleActions() {
	// Регистрация всех обработчиков действий один раз

	// Типы данных
	bot.action(/^type_(.*)$/, async (ctx) => {
		const selectedType = ctx.match[1];
		const userId = String(ctx.from.id);
		let query = ctx.session?.editingConfig?.query || {};
		query['type'] = selectedType;

		// Сохраняем текущий query в сессии
		if (!ctx.session) ctx.session = {};
		ctx.session.editingConfig = ctx.session.editingConfig || {};
		ctx.session.editingConfig.query = query;

		const columns = await getTypeColumns(selectedType);
		const columnButtons = columns.map(col => Markup.button.callback(col, `column_${col}`));
		const columnKeyboard = chunk(columnButtons, 3);
		await ctx.reply("Select a field for filtering or sorting:", Markup.inlineKeyboard(columnKeyboard));
	});

	// Колонки
	bot.action(/^column_(.*)$/, async (ctx) => {
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
	});

	// Сортировка по убыванию
	bot.action(/^sort_desc_(.*)$/, async (ctx) => {
		const column = ctx.match[1];
		if (ctx.session?.editingConfig) {
			ctx.session.editingConfig.query[`sort[${column}]`] = "desc";
			await ctx.reply(`Sorting by ${column} in descending order set.`);
			await askContinueOrSave(ctx);
		} else {
			await ctx.reply("Сессия не найдена. Пожалуйста, начните заново.");
		}
	});

	// Сортировка по возрастанию
	bot.action(/^sort_asc_(.*)$/, async (ctx) => {
		const column = ctx.match[1];
		if (ctx.session?.editingConfig) {
			ctx.session.editingConfig.query[`sort[${column}]`] = "asc";
			await ctx.reply(`Sorting by ${column} in ascending order set.`);
			await askContinueOrSave(ctx);
		} else {
			await ctx.reply("Сессия не найдена. Пожалуйста, начните заново.");
		}
	});

	// Фильтр минимум
	bot.action(/^filter_min_(.*)$/, async (ctx) => {
		const column = ctx.match[1];
		await ctx.reply(`Введите минимальное значение для фильтрации по ${column}:`);

		// Удаляем все существующие обработчики текста
		bot.off('text');

		// Создаем одноразовый обработчик текста
		const handler = async (msgCtx) => {
			if (msgCtx.chat.id === ctx.chat.id) {
				const minValue = msgCtx.message.text;
				if (ctx.session?.editingConfig) {
					ctx.session.editingConfig.query[`min${capitalizeFirstLetter(column)}`] = minValue;
					await ctx.reply(`Минимальное значение для ${column} установлено: ${minValue}.`);
					await askContinueOrSave(ctx);
				} else {
					await ctx.reply("Сессия не найдена. Пожалуйста, начните заново.");
				}
				// Удаляем обработчик после использования
				bot.off('text', handler);
			}
		};

		// Добавляем обработчик
		bot.on('text', handler);
	});

	// Фильтр максимум
	bot.action(/^filter_max_(.*)$/, async (ctx) => {
		const column = ctx.match[1];
		await ctx.reply(`Введите максимальное значение для фильтрации по ${column}:`);

		// Удаляем все существующие обработчики текста
		bot.off('text');

		// Создаем одноразовый обработчик текста
		const handler = async (msgCtx) => {
			if (msgCtx.chat.id === ctx.chat.id) {
				const maxValue = msgCtx.message.text;
				if (ctx.session?.editingConfig) {
					ctx.session.editingConfig.query[`max${capitalizeFirstLetter(column)}`] = maxValue;
					await ctx.reply(`Максимальное значение для ${column} установлено: ${maxValue}.`);
					await askContinueOrSave(ctx);
				} else {
					await ctx.reply("Сессия не найдена. Пожалуйста, начните заново.");
				}
				// Удаляем обработчик после использования
				bot.off('text', handler);
			}
		};

		// Добавляем обработчик
		bot.on('text', handler);
	});

	// Изменение %
	bot.action(/^includes_(.*)$/, async (ctx) => {
		const column = ctx.match[1];
		
		// Инициализируем сессию, если она не существует
		if (!ctx.session) {
			ctx.session = {};
		}
		
		// Инициализируем editingConfig, если он не существует
		if (!ctx.session.editingConfig) {
			ctx.session.editingConfig = {
				configId: generateId(),
				query: {},
				destination: { type: 'private', id: String(ctx.from.id) },
				name: ''
			};
		}

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
	});

	// Изменение периода %
	bot.action(/^change(\d+s|\dm|\dh)_(.*)$/, async (ctx) => {
		const time = ctx.match[1]; // например, '10s', '1m', '1h'
		const column = ctx.match[2];
		const changeField = `${column}Change${capitalizeFirstLetter(time)}`;

		// Инициализируем сессию, если она не существует
		if (!ctx.session) {
			ctx.session = {};
		}
		
		// Инициализируем editingConfig, если он не существует
		if (!ctx.session.editingConfig) {
			ctx.session.editingConfig = {
				configId: generateId(),
				query: {},
				destination: { type: 'private', id: String(ctx.from.id) },
				name: ''
			};
		}

		// Убедимся, что query существует
		if (!ctx.session.editingConfig.query) {
			ctx.session.editingConfig.query = {};
		}

		ctx.session.editingConfig.query[`includes[${column}]`] = `change${capitalizeFirstLetter(time)}`;
		await ctx.reply(`Изменение для ${changeField} установлено.`);
		await askContinueOrSave(ctx);
	});

	// Редактирование запроса
	bot.action(/^edit_query_(.+)$/, async (ctx) => {
		const configId = ctx.match[1];
		const userId = String(ctx.from.id);
		const configs = CLIENTS.get(userId) || [];
		const config = configs.find(c => c.id === configId);

		if (!config) {
			await ctx.reply('Конфигурация не найдена');
			return;
		}

		// Остановка текущего прослушивания
		stop(configId);

		// Начало нового процесса редактирования с существующими параметрами
		let query = { ...config.query };
		const dataTypes = await getDataTypes();
		const typeButtons = dataTypes.map(type => Markup.button.callback(type, `type_${type}`));
		const typeKeyboard = chunk(typeButtons, 3);
		await ctx.reply("Select data type to modify:", Markup.inlineKeyboard(typeKeyboard));

		// Сохранение текущих деталей конфигурации в сессии
		ctx.session = {
			editingConfig: {
				configId,
				query,
				destination: config.destination,
				name: config.name
			}
		};
	});

	// Список конфигураций
	bot.action('list_websockets', async (ctx) => {
		await listWebsockets(ctx);
	});

	// Создание новой конфигурации
	bot.action('create_websocket', async (ctx) => {
		const userId = String(ctx.from.id);
		telegramQueue.clear();
		stop(userId);
		let query: Record<string, string | number> = {};

		const dataTypes = await getDataTypes();
		const typeButtons = dataTypes.map(type => Markup.button.callback(type, `type_${type}`));
		const typeKeyboard = chunk(typeButtons, 3);
		await ctx.reply("Выберите тип данных:", Markup.inlineKeyboard([
			...typeKeyboard,
			[Markup.button.callback('« Назад', 'back_to_start')]
		]));

		// Инициализация сессии для новой конфигурации
		ctx.session = {
			editingConfig: {
				configId: generateId(),
				query: {},
				destination: { type: 'private', id: String(ctx.from.id) }, // По умолчанию личные сообщения
				name: ''
			}
		};
	});

	// Возврат к началу
	bot.action('back_to_start', async (ctx) => {
		await ctx.reply(
			'Выберите действие:',
			Markup.inlineKeyboard([
				[Markup.button.callback('📋 Список отслеживаний', 'list_websockets')],
				[Markup.button.callback('➕ Добавить новое отслеживание', 'create_websocket')]
			])
		);
	});

	// Управление конфигурацией
	bot.action(/^manage_(.+)$/, async (ctx) => {
		const configId = ctx.match[1];
		await manageWebsocket(ctx, configId);
	});

	// Удаление конфигурации
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

	// Переключение активности конфигурации
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
}

bot.launch(() => {
	CLIENTS.forEach((config, userId) => {
		if (!config.destination || !config.destination.type || !config.destination.id) {
			console.error(`Invalid config for user ${userId}: missing destination`);
			return;
		}
		start(userId, config.query);
		listen(userId, (data) => {
			telegramQueue.add(async () => {
				const destination = config.destination.type === 'private' ? userId : config.destination.id;
				const parseMode = 'Markdown';
				const message = getMessageByItem(data.data);
				
				if (config.destination.type === 'private') {
					bot.telegram.sendMessage(destination, message, { parse_mode: parseMode });
				} else {
					bot.telegram.sendMessage(`@${destination}`, message, { parse_mode: parseMode });
				}
			});
		});
	});
});

async function askContinueOrSave(ctx: any) {
	const continueButton = Markup.button.callback("Продолжить", "continue");
	const saveButton = Markup.button.callback("Сохранить", "save");
	await ctx.reply("Что вы хотите сделать дальше?", Markup.inlineKeyboard([
		[continueButton, saveButton]
	]));

	// Обработчик продолжения
	bot.action('continue', async (ctx) => {
		await ctx.reply("Продолжайте настройку.");
	});

	// Обработчик сохранения
	bot.action('save', async (ctx) => {
		if (ctx.session?.editingConfig) {
			const { configId, query, destination, name } = ctx.session.editingConfig;

			// Запрос имени конфигурации, если оно еще не установлено
			if (!name) {
				await ctx.reply("Введите имя для конфигурации:");
				
				// Удаляем все существующие обработчики текста
				bot.off('text');

				// Создаем одноразовый обработчик текста для имени
				const nameHandler = async (msgCtx) => {
					if (msgCtx.chat.id === ctx.chat.id) {
						const configName = msgCtx.message.text;
						ctx.session.editingConfig.name = configName;

						// Добавляем конфигурацию
						const userId = String(ctx.from.id);
						const configs = CLIENTS.get(userId) || [];
						configs.push({
							id: configId,
							query,
							destination,
							isActive: true,
							name: configName
						});
						CLIENTS.set(userId, configs);

						// Запуск прослушивания
						start(configId, query);
						listen(configId, createMessageHandler({
							id: configId,
							query,
							destination,
							isActive: true,
							name: configName
						}));

						await ctx.reply("Конфигурация сохранена успешно!");
						await listWebsockets(ctx);
						
						// Удаляем обработчик после использования
						bot.off('text', nameHandler);
					}
				};

				// Добавляем обработчик
				bot.on('text', nameHandler);
			} else {
				// Если имя уже установлено, сохраняем конфигурацию
				const userId = String(ctx.from.id);
				const configs = CLIENTS.get(userId) || [];
				const existingConfigIndex = configs.findIndex(c => c.id === configId);

				if (existingConfigIndex !== -1) {
					configs[existingConfigIndex].query = query;
					configs[existingConfigIndex].destination = destination;
				} else {
					configs.push({
						id: configId,
						query,
						destination,
						isActive: true,
						name
					});
				}

				CLIENTS.set(userId, configs);

				// Запуск прослушивания
				start(configId, query);
				listen(configId, createMessageHandler({
					id: configId,
					query,
					destination,
					isActive: true,
					name
				}));

				await ctx.reply("Конфигурация сохранена успешно!");
				await listWebsockets(ctx);
			}
		} else {
			await ctx.reply("Сессия не найдена. Пожалуйста, начните заново.");
		}
	});
}

function createMessageHandler(config: any) {
	return (data: any) => {
		const message = getMessageByItem(data.data);
		if (config.destination.type === 'private') {
			telegramQueue.add(async () => {
				bot.telegram.sendMessage(config.destination.id, message, {
					parse_mode: 'Markdown'
				});
			});
		} else if (config.destination.type === 'channel') {
			telegramQueue.add(async () => {
				bot.telegram.sendMessage(`@${config.destination.id}`, message, {
					parse_mode: 'Markdown'
				});
			});
		}
	};
}
