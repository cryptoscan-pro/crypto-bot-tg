import "dotenv/config";
import { Context, NarrowedContext, Middleware, session } from 'telegraf';
import { Message, Update } from 'telegraf/types';
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';

interface SessionData {
    editingConfig?: any;
    selectedConfig?: any;
    configs?: Record<string, any>;
}

interface MyContext extends Context {
    session: SessionData;
}

interface MessageOptions extends ExtraReplyMessage {
    disable_web_page_preview?: boolean;
    parse_mode?: string;
    message_thread_id?: number;
}

type BotContext = Context & {
    session: SessionData;
};
import { bot, CLIENTS_FILE_PATH, telegramQueue } from "./utils/constants";
import Queue from 'p-queue';
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
import { capitalizeFirstLetter } from "./utils/formatting"; // Assumes there's a utility for this
import { generateId } from "./utils/generateId";
import { formatWithGPT } from "./services/openaiService";
import { clearMessage } from "./utils/clearMessage";
import path from "path";

type PendingHandler = {
    type: 'filter_min' | 'filter_max' | 'config_name' | 'channel_id' | 'ai_prompt' | 'suffix' | 'timeout' | 'manual_message' | 'template_path';
    column?: string;
    ctx: any;
};

let pendingHandler: PendingHandler | null = null;

bot.use(session<SessionData, BotContext>());

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
		'Choose an action:',
		Markup.inlineKeyboard([
			[Markup.button.callback('📋 List of Trackings', 'list_websockets')],
			[Markup.button.callback('➕ Add New Tracking', 'create_websocket')]
		])
	);

	// Action handlers moved here to avoid re-registration
	handleActions();
});

function handleActions() {
	// Register all action handlers once

	// Data types
	bot.action(/^type_(.*)$/, async (ctx) => {
		const selectedType = ctx.match[1];
		const userId = String(ctx.from.id);
		let query = ctx.session?.editingConfig?.query || {};
		query['type'] = selectedType;

		// Save current query in session
		if (!ctx.session) ctx.session = {};
		ctx.session.editingConfig = ctx.session.editingConfig || {};
		ctx.session.editingConfig.query = query;

		const columns = await getTypeColumns(selectedType);
		const columnButtons = columns.map(col => Markup.button.callback(col, `column_${col}`));
		const columnKeyboard = chunk(columnButtons, 3);
		await ctx.reply("Select a field for filtering or sorting:", Markup.inlineKeyboard(columnKeyboard));
	});

	// Columns
	bot.action(/^column_(.*)$/, async (ctx) => {
		const selectedColumn = ctx.match[1];
		const actions = [
			Markup.button.callback("Sort Descending", `sort_desc_${selectedColumn}`),
			Markup.button.callback("Sort Ascending", `sort_asc_${selectedColumn}`),
			Markup.button.callback("Minimum Filter", `filter_min_${selectedColumn}`),
			Markup.button.callback("Maximum Filter", `filter_max_${selectedColumn}`),
			Markup.button.callback("Change %", `includes_${selectedColumn}`)
		];
		const actionsKeyboard = chunk(actions, 2);
		await ctx.reply("Select an action:", Markup.inlineKeyboard(actionsKeyboard));
	});

	// Sort Descending
	bot.action(/^sort_desc_(.*)$/, async (ctx) => {
		const column = ctx.match[1];
		if (ctx.session?.editingConfig) {
			ctx.session.editingConfig.query[`sort[${column}]`] = "desc";
			await ctx.reply(`Set sorting by ${column} descending.`);
			await askContinueOrSave(ctx);
		} else {
			await ctx.reply("Session not found. Please start over.");
		}
	});

	bot.action(/^sort_asc_(.*)$/, async (ctx) => {
		const column = ctx.match[1];
		if (ctx.session?.editingConfig) {
			ctx.session.editingConfig.query[`sort[${column}]`] = "asc";
			await ctx.reply(`Set sorting by ${column} ascending.`);
			await askContinueOrSave(ctx);
		} else {
			await ctx.reply("Session not found. Please start over.");
		}
	});

	bot.on('text', async (ctx) => {
		if (!pendingHandler) return;

		const text = ctx.message.text;

		switch (pendingHandler.type) {
			case 'filter_min': {
				const column = pendingHandler.column;
				if (pendingHandler.ctx.session?.editingConfig) {
					pendingHandler.ctx.session.editingConfig.query[`min${capitalizeFirstLetter(column!)}`] = text;
					await ctx.reply(`Minimum value for ${column} set: ${text}.`);
					await askContinueOrSave(pendingHandler.ctx);
				} else {
					await ctx.reply("Session not found. Please start over.");
				}
				pendingHandler = null;
				break;
			}
			case 'filter_max': {
				const column = pendingHandler.column;
				if (pendingHandler.ctx.session?.editingConfig) {
					pendingHandler.ctx.session.editingConfig.query[`max${capitalizeFirstLetter(column!)}`] = text;
					await ctx.reply(`Maximum value for ${column} set: ${text}.`);
					await askContinueOrSave(pendingHandler.ctx);
				} else {
					await ctx.reply("Session not found. Please start over.");
				}
				pendingHandler = null;
				break;
			}
			case 'config_name': {
				if (pendingHandler.ctx.session?.editingConfig) {
					const { configId, query, destination, aiPrompt } = pendingHandler.ctx.session.editingConfig;
					pendingHandler.ctx.session.editingConfig.name = text;

					const userId = String(ctx.from.id);
					const configs = CLIENTS.get(userId) || [];
					configs.push({
						id: configId,
						query,
						destination,
						isActive: true,
						name: text,
						aiPrompt
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

					await ctx.reply("Configuration saved successfully!");
					await listWebsockets(ctx);
				} else {
					await ctx.reply("Session not found. Please start over.");
				}
				pendingHandler = null;
				break;
			}
            case 'channel_id': {
                if (pendingHandler.ctx.session?.editingConfig) {
                    let channelId = text.trim();
                    
                    try {
                        if (channelId.startsWith('-100')) {
                            await ctx.telegram.getChat(channelId);
                        } else {
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
                            type: 'suffix',
                            ctx: pendingHandler.ctx
                        };
                        await ctx.reply("Enter a suffix for messages (or send '-' if you don't need it):");
                    } catch (error) {
                        console.error('Error checking channel access:', error);
                        await ctx.reply(
                            "Error accessing channel. Please ensure that:\n" +
                            "1. The bot is added to the channel as an administrator\n" +
                            "2. The channel ID is correct\n" +
                            "Try again:"
                        );
                    }
                } else {
                    await ctx.reply("Session not found. Please start over.");
                }
                break;
            }
            case 'ai_prompt': {
                if (pendingHandler.ctx.session?.editingConfig) {
                    pendingHandler.ctx.session.editingConfig.aiPrompt = text;
                    
                    // Continue with destination selection
                    await ctx.reply(
                        "Select where to send notifications:",
                        Markup.inlineKeyboard([
                            [Markup.button.callback('📱 Private Messages', 'dest_private')],
                            [Markup.button.callback('📢 Channel', 'dest_channel')]
                        ])
                    );
                } else {
                    await ctx.reply("Session not found. Please start over.");
                }
                pendingHandler = null;
                break;
            }
            case 'suffix': {
                if (pendingHandler.ctx.session?.editingConfig) {
                    pendingHandler.ctx.session.editingConfig.suffix = text;
                    
                    // Move to timeout request
                    pendingHandler = {
                        type: 'timeout',
                        ctx: pendingHandler.ctx
                    };
                    await ctx.reply("Enter message delay in milliseconds (or send '0' for no delay):");
                } else {
                    await ctx.reply("Session not found. Please start over.");
                }
                break;
            }
            case 'timeout': {
                if (pendingHandler.ctx.session?.editingConfig) {
                    const timeout = parseInt(text);
                    if (isNaN(timeout) || timeout < 0) {
                        await ctx.reply("Please enter a valid non-negative number for timeout:");
                        return;
                    }
                    
                    pendingHandler.ctx.session.editingConfig.timeout = timeout;
                    
                    // Move to configuration name request
                    pendingHandler = {
                        type: 'config_name',
                        ctx: pendingHandler.ctx
                    };
                    await ctx.reply("Enter a name for the configuration:");
                } else {
                    await ctx.reply("Session not found. Please start over.");
                }
                pendingHandler = null;
                break;
            }
            case 'template_path': {
                if (pendingHandler.ctx.session?.editingConfig) {
                    try {
                        const templatePath = path.resolve(process.cwd(), text);
                        const template = require(templatePath);
                        
                        if (typeof template.default !== 'function') {
                            await ctx.reply("Template file must export a default function. Please check the file and try again:");
                            return;
                        }
                        
                        pendingHandler.ctx.session.editingConfig.templatePath = text;
                        
                        // Continue with destination selection
                        await ctx.reply(
                            "Select where to send notifications:",
                            Markup.inlineKeyboard([
                                [Markup.button.callback('📱 Private Messages', 'dest_private')],
                                [Markup.button.callback('📢 Channel', 'dest_channel')]
                            ])
                        );
                    } catch (error) {
                        await ctx.reply("Error loading template file. Please check the path and try again:");
                        return;
                    }
                } else {
                    await ctx.reply("Session not found. Please start over.");
                }
                pendingHandler = null;
                break;
            }
            case 'manual_message': {
                if (pendingHandler.ctx.session?.selectedConfig) {
                    try {
                        let message = text;
                        const config = pendingHandler.ctx.session.selectedConfig;

                        if (config.aiPrompt) {
                            try {
                                message = await formatWithGPT(message, config.aiPrompt);
                            } catch (error) {
                                console.error('[AI] Error processing message:', error);
                            }
                        }

                        if (config.suffix && config.suffix !== '-') {
                            message = `${message}\n\n${config.suffix}`;
                        }

                        try {
                            if (config.destination.type === 'private') {
                                try {
                                    await ctx.telegram.sendMessage(config.destination.id, message, {
                                        parse_mode: 'Markdown',
                                        disable_web_page_preview: true as const
                                    });
                                } catch (error) {
                                    // If first attempt fails, try with cleared message
                                    await ctx.telegram.sendMessage(config.destination.id, clearMessage(message), {
                                        parse_mode: 'Markdown',
                                        disable_web_page_preview: true as const
                                    });
                                }
                            } else if (config.destination.type === 'channel') {
                                let channelId = config.destination.id;
                                if (channelId.startsWith('-100')) {
                                    channelId = config.destination.id;
                                } else if (!channelId.startsWith('@')) {
                                    channelId = `@${channelId}`;
                                }
                                
                                try {
                                    await ctx.telegram.sendMessage(channelId, message, {
                                        parse_mode: 'Markdown',
                                        message_thread_id: config.destination.topicId,
                                        disable_web_page_preview: true as const
                                    });
                                } catch (error) {
                                    // If first attempt fails, try with cleared message
                                    await ctx.telegram.sendMessage(channelId, clearMessage(message), {
                                        parse_mode: 'Markdown',
                                        message_thread_id: config.destination.topicId,
                                        disable_web_page_preview: true as const
                                    });
                                }
                            }
                            await ctx.reply("Message sent successfully!");
                        } catch (error) {
                            console.error('[Telegram] Error sending message:', error);
                            await ctx.reply("Error sending message. Please try again.");
                        }
                    } catch (error) {
                        console.error('[Manual Message] Error processing message:', error);
                        await ctx.reply("Error processing message. Please try again.");
                    }
                    pendingHandler = null;
                } else {
                    await ctx.reply("No configuration selected. Please use /send command again.");
                }
                break;
            }
		}
	});

	// Minimum Filter
	bot.action(/^filter_min_(.*)$/, async (ctx) => {
		const column = ctx.match[1];
		pendingHandler = {
			type: 'filter_min',
			column,
			ctx
		};
		await ctx.reply(`Enter the minimum value for filtering by ${column}:`);
	});

	// Maximum Filter
	bot.action(/^filter_max_(.*)$/, async (ctx) => {
		const column = ctx.match[1];
		pendingHandler = {
			type: 'filter_max',
			column,
			ctx
		};
		await ctx.reply(`Enter the maximum value for filtering by ${column}:`);
	});

	// Change %
	bot.action(/^includes_(.*)$/, async (ctx) => {
		const column = ctx.match[1];
		
		// Initialize session if it doesn't exist
		if (!ctx.session) {
			ctx.session = {};
		}
		
		// Initialize editingConfig if it doesn't exist
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
		await ctx.reply("Select the period for percentage change:", Markup.inlineKeyboard(changeActionsKeyboard));
	});

	// Change period %
	bot.action(/^change(\d+s|\dm|\dh)_(.*)$/, async (ctx) => {
		const time = ctx.match[1]; // e.g., '10s', '1m', '1h'
		const column = ctx.match[2];
		const changeField = `${column}Change${capitalizeFirstLetter(time)}`;

		// Initialize session if it doesn't exist
		if (!ctx.session) {
			ctx.session = {};
		}
		
		// Initialize editingConfig if it doesn't exist
		if (!ctx.session.editingConfig) {
			ctx.session.editingConfig = {
				configId: generateId(),
				query: {},
				destination: { type: 'private', id: String(ctx.from.id) },
				name: ''
			};
		}

		// Ensure query exists
		if (!ctx.session.editingConfig.query) {
			ctx.session.editingConfig.query = {};
		}

		ctx.session.editingConfig.query[`includes[${column}]`] = `change${capitalizeFirstLetter(time)}`;
		await ctx.reply(`Change for ${changeField} set.`);
		await askContinueOrSave(ctx);
	});

	// Edit query
	bot.action(/^edit_query_(.+)$/, async (ctx) => {
		const configId = ctx.match[1];
		const userId = String(ctx.from.id);
		const configs = CLIENTS.get(userId) || [];
		const config = configs.find(c => c.id === configId);

		if (!config) {
			await ctx.reply(clearMessage('Configuration not found'));
			return;
		}

		// Stop current listening
		stop(configId);

		// Start new editing process with existing parameters
		let query = { ...config.query };
		const dataTypes = await getDataTypes();
		const typeButtons = dataTypes.map(type => Markup.button.callback(type, `type_${type}`));
		const typeKeyboard = chunk(typeButtons, 3);
		await ctx.reply("Select data type:", Markup.inlineKeyboard(typeKeyboard));

		// Save current configuration details in session
		ctx.session = {
			editingConfig: {
				configId,
				query,
				destination: config.destination,
				name: config.name
			}
		};
	});

	// List configurations
	bot.action('list_websockets', async (ctx) => {
		await listWebsockets(ctx);
	});

	// Create new configuration
	bot.action('create_websocket', async (ctx) => {
		const userId = String(ctx.from.id);
		telegramQueue.clear();
		stop(userId);

		// Ensure destination is correctly initialized
		const destination = {
			type: 'private' as const,
			id: String(ctx.from.id)
		};

		// Initialize session for new configuration
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
		await ctx.reply("Select data type:", Markup.inlineKeyboard([
			...typeKeyboard,
			[Markup.button.callback('« Back', 'back_to_start')]
		]));
	});

	// Return to start
	bot.action('back_to_start', async (ctx) => {
		await ctx.reply(
			'Choose an action:',
			Markup.inlineKeyboard([
				[Markup.button.callback('📋 List of Trackings', 'list_websockets')],
				[Markup.button.callback('➕ Add New Tracking', 'create_websocket')]
			])
		);
	});

	// Manage configuration
	bot.action(/^manage_(.+)$/, async (ctx) => {
		const configId = ctx.match[1];
		await manageWebsocket(ctx, configId);
	});

	// Delete configuration
	bot.action(/^delete_(.+)$/, async (ctx) => {
		const configId = ctx.match[1];
		const userId = String(ctx.from.id);
		const configs = CLIENTS.get(userId) || [];
		const newConfigs = configs.filter(c => c.id !== configId);

		stop(configId);
		CLIENTS.set(userId, newConfigs);

		await ctx.reply(clearMessage('Configuration successfully deleted'));
		await listWebsockets(ctx);
	});

	// Toggle configuration activity
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

const queue = new Queue({ 
	intervalCap: 1,
	interval: 1000,
});

bot.command('send', async (ctx) => {
    // Получаем список существующих конфигураций
    const configs = Object.values(ctx.session.configs || {});
    
    if (configs.length === 0) {
        await ctx.reply(clearMessage("You don't have any saved configurations. Please create one first."));
        return;
    }

    // Формируем клавиатуру с конфигурациями
    const keyboard = Markup.inlineKeyboard(
        configs.map((config) => [
            Markup.button.callback(
                `${config.enabled ? '✅' : '❌'} ${config.name}`,
                `select_config_${config.id}`
            )
        ])
    );

    await ctx.reply("Select a configuration to send message:", keyboard);
});

bot.action(/^select_config_(\d+)$/, async (ctx) => {
    const configId = Number(ctx.match[1]);
    const config = Object.values(ctx.session.configs || {}).find((c) => c.id === configId);

    if (!config) {
        await ctx.reply(clearMessage("Configuration not found. Please try again."));
        return;
    }

    // Сохраняем выбранную конфигурацию в сессии
    ctx.session.selectedConfig = config;

    // Запрашиваем текст сообщения
    pendingHandler = {
        type: 'manual_message',
        ctx
    };
    await ctx.reply(clearMessage("Enter the message you want to send:"));
});

bot.launch(() => {
	CLIENTS.forEach((configs, userId) => {
		if (!Array.isArray(configs)) {
			console.error(`Invalid configs for user ${userId}: not an array`);
			return;
		}

		configs.forEach(config => {
			// Check configuration validity
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
				queue.add(() => {
					start(config.id, config.query);
					listen(config.id, createMessageHandler(config))
				});
			}
		});
	});
});

async function askContinueOrSave(ctx: any) {
    const continueButton = Markup.button.callback("Continue", "continue");
    const saveButton = Markup.button.callback("Save", "save");
    await ctx.reply(clearMessage("What do you want to do next?"), Markup.inlineKeyboard([
        [continueButton, saveButton]
    ]));

    // Continue handler
    bot.action('continue', async (ctx) => {
        const currentType = ctx.session?.editingConfig?.query?.type;
        
        if (!currentType) {
            await ctx.reply(clearMessage("Error: data type not found. Please start over."));
            return;
        }

        // Get standard columns for current data type
        const standardColumns = await getTypeColumns(currentType);
        
        // Find percentage change fields in current query
        const percentageFields = Object.entries(ctx.session?.editingConfig?.query || {})
            .filter(([key]) => key.startsWith('includes['))
            .map(([key, value]) => {
                const column = key.match(/includes\[(.*?)\]/)?.[1];
                if (column && typeof value === 'string') {
                    // Convert 'change10s' to 'priceChange10s'
                    return `${column}${value.charAt(0).toUpperCase()}${value.slice(1)}`;
                }
                return null;
            })
            .filter(Boolean);

        // Combine standard columns with percentage change fields
        const allColumns = [...standardColumns, ...percentageFields];
        
        // Create buttons for all fields
        const columnButtons = allColumns.map(col => Markup.button.callback(col, `column_${col}`));
        const columnKeyboard = chunk(columnButtons, 3);
        
        await ctx.reply(clearMessage("Select a field for filtering or sorting:"), Markup.inlineKeyboard(columnKeyboard));
    });

    // Save handler
    bot.action('save', async (ctx) => {
        if (!ctx.session?.editingConfig) {
            await ctx.reply(clearMessage("Session not found. Please start over."));
            return;
        }

        // Ask about AI processing first
        await ctx.reply(
            "Use AI for message processing?",
            Markup.inlineKeyboard([
                [Markup.button.callback('Yes', 'ai_yes')],
                [Markup.button.callback('No', 'ai_no')]
            ])
        );
    });

    // Add new action handlers for AI choice
    bot.action('ai_yes', async (ctx) => {
        if (!ctx.session?.editingConfig) {
            await ctx.reply("Session not found. Please start over.");
            return;
        }

        pendingHandler = {
            type: 'ai_prompt',
            ctx
        };
        await ctx.reply(clearMessage("Enter a prompt for message processing:"));
    });

    bot.action('ai_no', async (ctx) => {
        if (!ctx.session?.editingConfig) {
            await ctx.reply("Session not found. Please start over.");
            return;
        }

        // Ask about template first
        await ctx.reply(
            "Do you want to use a custom template for message formatting?",
            Markup.inlineKeyboard([
                [Markup.button.callback('Yes', 'template_yes')],
                [Markup.button.callback('No', 'template_no')]
            ])
        );
    });

    bot.action('template_yes', async (ctx) => {
        if (!ctx.session?.editingConfig) {
            await ctx.reply("Session not found. Please start over.");
            return;
        }

        pendingHandler = {
            type: 'template_path',
            ctx
        };
        await ctx.reply(clearMessage("Enter the path to your template file (relative to project root):"));
    });

    bot.action('template_no', async (ctx) => {
        if (!ctx.session?.editingConfig) {
            await ctx.reply("Session not found. Please start over.");
            return;
        }

        // Continue with destination selection
        await ctx.reply(
            "Select where to send notifications:",
            Markup.inlineKeyboard([
                [Markup.button.callback('📱 Private Messages', 'dest_private')],
                [Markup.button.callback('📢 Channel', 'dest_channel')]
            ])
        );
    });

    // Handler for private messages choice
    bot.action('dest_private', async (ctx) => {
        if (!ctx.session?.editingConfig) {
            await ctx.reply("Session not found. Please start over.");
            return;
        }

        ctx.session.editingConfig.destination = {
            type: 'private',
            id: String(ctx.from.id)
        };

        // Ask for suffix first
        pendingHandler = {
            type: 'suffix',
            ctx
        };
        await ctx.reply("Enter a suffix for messages (or send '-' if you don't need it):");
    });

    // Handler for channel choice
    bot.action('dest_channel', async (ctx) => {
        if (!ctx.session?.editingConfig) {
            await ctx.reply("Session not found. Please start over.");
            return;
        }

        pendingHandler = {
            type: 'channel_id',
            ctx
        };
        await ctx.reply("Enter the channel ID (without the @ symbol):");
    });
}

function createMessageHandler(config: any) {
    return async (data: any) => {
        let message;
        
        // If template path is specified, use it
        if (config.templatePath) {
            try {
                const template = require(path.resolve(process.cwd(), config.templatePath));
                if (typeof template.default === 'function') {
                    message = await template.default(data.data);
                } else {
                    console.error('[Template] Default export is not a function');
                    message = getMessageByItem(data.data);
                }
            } catch (error) {
                console.error('[Template] Error using template:', error);
                message = getMessageByItem(data.data);
            }
        } else {
            message = getMessageByItem(data.data);
        }

        console.log(`[WebSocket] Received message for configuration "${config.name}"`);

        if (config.aiPrompt) {
            try {
                message = await formatWithGPT(message, config.aiPrompt);
            } catch (error) {
                console.error('[AI] Error processing message:', error);
            }
        }

        if (config.suffix && config.suffix !== '-') {
            message = `${message}\n\n${config.suffix}`;
        }

        const sendMessage = async () => {
    const messageOptions = {
        parse_mode: 'MarkdownV2' as const,
        disable_web_page_preview: true as const
    };
    
    const channelMessageOptions = {
        ...messageOptions,
        message_thread_id: config.destination.topicId
    } as const;
            if (config.destination.type === 'private') {
                telegramQueue.add(async () => {
                    try {
                        try {
                            await bot.telegram.sendMessage(config.destination.id, message, messageOptions);
                            console.log(`[Telegram] Message successfully sent to private chat: ${config.destination.id}`);
                        } catch (error) {
                            // If first attempt fails, try with cleared message
                            await bot.telegram.sendMessage(config.destination.id, clearMessage(message), messageOptions);
                            console.log(`[Telegram] Message successfully sent to private chat (with clearMessage): ${config.destination.id}`);
                        }
                    } catch (error) {
                        console.error(`[Telegram] Error sending to private chat:`, error);
                        console.error('Message:', message);
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
                    
                        await bot.telegram.sendMessage(channelId, clearMessage(message), channelMessageOptions);
                        console.log(`[Telegram] Message successfully sent to channel: ${channelId}`);
                    } catch (error) {
                        console.error(`[Telegram] Error sending to channel ${config.destination.id}:`, error);
                        console.error('Message:', message);
                    }
                });
            }
        };

        // Apply timeout if configured
        if (config.timeout && config.timeout > 0) {
            setTimeout(sendMessage, config.timeout);
        } else {
            await sendMessage();
        }
    };
}
