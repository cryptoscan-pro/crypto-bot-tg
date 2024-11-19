import "dotenv/config";
import { session } from 'telegraf';
import { bot, CLIENTS_FILE_PATH, telegramQueue } from "./utils/constants";

type PendingHandler = {
    type: 'filter_min' | 'filter_max' | 'config_name' | 'channel_id';
    column?: string;
    ctx: any;
};

let pendingHandler: PendingHandler | null = null;

// Initialize session middleware
bot.use(session());
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

	// Global text handler
	bot.on('text', async (ctx) => {
		if (!pendingHandler) return;

		const text = ctx.message.text;

		switch (pendingHandler.type) {
			case 'filter_min': {
				const column = pendingHandler.column;
				if (pendingHandler.ctx.session?.editingConfig) {
					pendingHandler.ctx.session.editingConfig.query[`min${capitalizeFirstLetter(column!)}`] = text;
					await ctx.reply(`Минимальное значение для ${column} установлено: ${text}.`);
					await askContinueOrSave(pendingHandler.ctx);
				} else {
					await ctx.reply("Сессия не найдена. Пожалуйста, начните заново.");
				}
				pendingHandler = null;
				break;
			}
			case 'filter_max': {
				const column = pendingHandler.column;
				if (pendingHandler.ctx.session?.editingConfig) {
					pendingHandler.ctx.session.editingConfig.query[`max${capitalizeFirstLetter(column!)}`] = text;
					await ctx.reply(`Максимальное значение для ${column} установлено: ${text}.`);
					await askContinueOrSave(pendingHandler.ctx);
				} else {
					await ctx.reply("Сессия не найдена. Пожалуйста, начните заново.");
				}
				pendingHandler = null;
				break;
			}
			case 'config_name': {
				if (pendingHandler.ctx.session?.editingConfig) {
					const { configId, query, destination } = pendingHandler.ctx.session.editingConfig;
					pendingHandler.ctx.session.editingConfig.name = text;

					const userId = String(ctx.from.id);
					const configs = CLIENTS.get(userId) || [];
					configs.push({
						id: configId,
						query,
						destination,
						isActive: true,
						name: text
					});
					CLIENTS.set(userId, configs);

					start(configId, query);
					listen(configId, createMessageHandler({
						id: configId,
						query,
						destination,
						isActive: true,
						name: text
					}));

					await ctx.reply("Конфигурация сохранена успешно!");
					await listWebsockets(ctx);
				} else {
					await ctx.reply("Сессия не найдена. Пожалуйста, начните заново.");
				}
				pendingHandler = null;
				break;
			}
            case 'channel_id': {
                if (pendingHandler.ctx.session?.editingConfig) {
                    let channelId = text.trim();
                    
                    try {
                        // Если ID начинается с -100, это числовой формат
                        if (channelId.startsWith('-100')) {
                            await ctx.telegram.getChat(channelId);
                        } else {
                            // Для текстового формата добавляем @ если нужно
                            if (!channelId.startsWith('@')) {
                                channelId = `@${channelId}`;
                            }
                            await ctx.telegram.getChat(channelId);
                        }
                        
                        pendingHandler.ctx.session.editingConfig.destination = {
                            type: 'channel',
                            id: channelId
                        };

                        pendingHandler = {
                            type: 'config_name',
                            ctx: pendingHandler.ctx
                        };
                        await ctx.reply("Введите имя для конфигурации:");
                    } catch (error) {
                        console.error('Error checking channel access:', error);
                        await ctx.reply(
                            "Ошибка доступа к каналу. Пожалуйста, убедитесь что:\n" +
                            "1. Бот добавлен в канал как администратор\n" +
                            "2. ID канала указан верно\n" +
                            "Попробуйте еще раз:"
                        );
                    }
                } else {
                    await ctx.reply("Сессия не найдена. Пожалуйста, начните заново.");
                }
                break;
            }
		}
	});

	// Фильтр минимум
	bot.action(/^filter_min_(.*)$/, async (ctx) => {
		const column = ctx.match[1];
		pendingHandler = {
			type: 'filter_min',
			column,
			ctx
		};
		await ctx.reply(`Введите минимальное значение для фильтрации по ${column}:`);
	});

	// Фильтр максимум
	bot.action(/^filter_max_(.*)$/, async (ctx) => {
		const column = ctx.match[1];
		pendingHandler = {
			type: 'filter_max',
			column,
			ctx
		};
		await ctx.reply(`Введите максимальное значение для фильтрации по ${column}:`);
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

		// Убедимся, что destination корректно инициализируется
		const destination = {
			type: 'private' as const,
			id: String(ctx.from.id)
		};

		// Инициализация сессии для новой конфигурации
		ctx.session = {
			editingConfig: {
				configId: generateId(),
				query: {},
				destination,
				name: ''
			}
		};

		const dataTypes = await getDataTypes();
		const typeButtons = dataTypes.map(type => Markup.button.callback(type, `type_${type}`));
		const typeKeyboard = chunk(typeButtons, 3);
		await ctx.reply("Выберите тип данных:", Markup.inlineKeyboard([
			...typeKeyboard,
			[Markup.button.callback('« Назад', 'back_to_start')]
		]));
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
	CLIENTS.forEach((configs, userId) => {
		if (!Array.isArray(configs)) {
			console.error(`Invalid configs for user ${userId}: not an array`);
			return;
		}

		configs.forEach(config => {
			// Проверяем валидность конфигурации
			if (!config || !config.destination || !config.destination.type || !config.destination.id) {
				console.error(`Invalid config for user ${userId}:`, config);
				return;
			}

			if (!config.query) {
				console.error(`Missing query in config for user ${userId}:`, config);
				return;
			}

			// Only start active configurations
			if (config.isActive) {
				start(config.id, config.query);
				listen(config.id, createMessageHandler(config));
			}
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
        const currentType = ctx.session?.editingConfig?.query?.type;
        
        if (!currentType) {
            await ctx.reply("Ошибка: тип данных не найден. Пожалуйста, начните заново.");
            return;
        }

        // Получаем стандартные колонки для текущего типа данных
        const standardColumns = await getTypeColumns(currentType);
        
        // Ищем поля с изменением процента в текущем query
        const percentageFields = Object.entries(ctx.session?.editingConfig?.query || {})
            .filter(([key]) => key.startsWith('includes['))
            .map(([key, value]) => {
                const column = key.match(/includes\[(.*?)\]/)?.[1];
                if (column && typeof value === 'string') {
                    // Преобразуем 'change10s' в 'priceChange10s'
                    return `${column}${value.charAt(0).toUpperCase()}${value.slice(1)}`;
                }
                return null;
            })
            .filter(Boolean);

        // Объединяем стандартные колонки с полями изменения процента
        const allColumns = [...standardColumns, ...percentageFields];
        
        // Создаем кнопки для всех полей
        const columnButtons = allColumns.map(col => Markup.button.callback(col, `column_${col}`));
        const columnKeyboard = chunk(columnButtons, 3);
        
        await ctx.reply("Select a field for filtering or sorting:", Markup.inlineKeyboard(columnKeyboard));
    });

    // Обработчик сохранения
    bot.action('save', async (ctx) => {
        if (!ctx.session?.editingConfig) {
            await ctx.reply("Сессия не найдена. Пожалуйста, начните заново.");
            return;
        }

        // Show destination choice buttons
        await ctx.reply(
            "Выберите куда отправлять уведомления:",
            Markup.inlineKeyboard([
                [Markup.button.callback('📱 Личные сообщения', 'dest_private')],
                [Markup.button.callback('📢 Канал', 'dest_channel')]
            ])
        );
    });

    // Handler for private messages choice
    bot.action('dest_private', async (ctx) => {
        if (!ctx.session?.editingConfig) {
            await ctx.reply("Сессия не найдена. Пожалуйста, начните заново.");
            return;
        }

        ctx.session.editingConfig.destination = {
            type: 'private',
            id: String(ctx.from.id)
        };

        // Ask for configuration name
        pendingHandler = {
            type: 'config_name',
            ctx
        };
        await ctx.reply("Введите имя для конфигурации:");
    });

    // Handler for channel choice
    bot.action('dest_channel', async (ctx) => {
        if (!ctx.session?.editingConfig) {
            await ctx.reply("Сессия не найдена. Пожалуйста, начните заново.");
            return;
        }

        pendingHandler = {
            type: 'channel_id',
            ctx
        };
        await ctx.reply("Введите ID канала (без символа @):");
    });
}

function createMessageHandler(config: any) {
    return (data: any) => {
        const message = getMessageByItem(data.data);
        console.log(`[WebSocket] Получено сообщение для конфигурации "${config.name}"`);

        if (config.destination.type === 'private') {
            telegramQueue.add(async () => {
                try {
                    await bot.telegram.sendMessage(config.destination.id, message, {
                        parse_mode: 'Markdown'
                    });
                    console.log(`[Telegram] Сообщение успешно отправлено в приватный чат: ${config.destination.id}`);
                } catch (error) {
                    console.error(`[Telegram] Ошибка отправки в приватный чат:`, error);
                }
            });
        } else if (config.destination.type === 'channel') {
            telegramQueue.add(async () => {
                try {
                    let channelId = config.destination.id;
                    if (channelId.startsWith('-100')) {
                        channelId = config.destination.id;
                    } else if (!channelId.startsWith('@')) {
                        channelId = `@${channelId}`;
                    }
                    
                    await bot.telegram.sendMessage(channelId, message, {
                        parse_mode: 'Markdown'
                    });
                    console.log(`[Telegram] Сообщение успешно отправлено в канал: ${channelId}`);
                } catch (error) {
                    console.error(`[Telegram] Ошибка отправки в канал ${config.destination.id}:`, error);
                    console.error('Сообщение:', message);
                }
            });
        }
    };
}
