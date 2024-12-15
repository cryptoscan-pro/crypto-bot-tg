# Telegram Bot - Cryptoscan

<img src="./assets/example.png" alt="Example Image" style="height:400px;">

## Description

@cryptoscan/cryptobot-tg is a Telegram bot that allows users to interact with cryptocurrency data. The bot provides the ability to sort and filter data by various parameters, as well as track changes in real-time.

## Installation

1. Clone the repository:
   ```bash
   git clone git@github.com:cryptoscan-pro/crypto-bot-tg.git
   ```
2. Navigate to the project directory:
   ```bash
   cd cryptoscan-cryptobot-tg
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

Create a `.env` file based on `.env.example` and specify the necessary environment variables:

- `BOT_TOKEN`: This is the API key for your Telegram bot. It is required to authenticate and interact with the Telegram API.
- `WEBSOCKET`: Set this to `1` to use WebSockets for real-time data updates, or `0` to use HTTP.

These configurations are crucial for the bot's operation, determining how it connects to Telegram and whether it uses WebSockets or HTTP for data communication.

## Running

To start the bot, use the command:
```bash
npm start
```

## Usage

After starting the bot, you can interact with it via Telegram:

1. Start the bot with `/start`
2. Choose between:
   - 📋 List of Trackings - View and manage existing configurations
   - ➕ Add New Tracking - Create a new configuration

When creating a new tracking:

1. Select a data type (e.g., types, arbitrage, contracts, networks)
2. Choose fields for sorting/filtering (e.g., id, type, exchange, symbol, etc.)
3. Select actions for the field:
   - Sort Descending
   - Sort Ascending 
   - Minimum Filter
   - Maximum Filter
   - Change %
4. For Change %, select an interval:
   - 5 seconds
   - 10 seconds
   - 15 seconds
   - 30 seconds
   - 1 minute
   - 1 hour
5. Choose to continue adding more filters or save
6. When saving:
   - Choose whether to use AI for message processing
   - Optionally set a custom message template
   - Select destination (private messages or channel)
   - Set message suffix
   - Set message delay (timeout)
   - Name your configuration

Additional Features:
- `/send` command to manually send messages using saved configurations
- Toggle configurations on/off
- Edit existing configurations
- Delete configurations

### Option Sets

The option sets in the bot are used to customize how data is retrieved and displayed. They allow users to:

- **Select Data Types**: Choose the type of cryptocurrency data to interact with, such as `types`, `arbitrage`, `contracts`, `networks`.
- **Choose Fields**: Specify which fields to sort or filter:
  - `id`: Unique identifier for the data entry.
  - `type`: The type of

## Description

@cryptoscan/cryptobot-tg is a Telegram bot that allows users to interact with cryptocurrency data. The bot provides the ability to sort and filter data by various parameters, as well as track changes in real-time.

## Installation

1. Clone the repository:
   ```bash
   git clone git@github.com:cryptoscan-pro/crypto-bot-tg.git
   ```
2. Navigate to the project directory:
   ```bash
   cd cryptoscan-cryptobot-tg
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

Create a `.env` file based on `.env.example` and specify the necessary environment variables:

- `BOT_TOKEN`: This is the API key for your Telegram bot. It is required to authenticate and interact with the Telegram API.
- `WEBSOCKET`: Set this to `1` to use WebSockets for real-time data updates, or `0` to use HTTP.

These configurations are crucial for the bot's operation, determining how it connects to Telegram and whether it uses WebSockets or HTTP for data communication.

## Running

To start the bot, use the command:
```bash
npm start
```

## Usage

After starting the bot, you can interact with it via Telegram. The command flow is as follows:

1. Start the bot with the command `/start`.
2. The bot will display buttons for selecting a data type, such as `types`, `arbitrage`, `contracts`, `networks`.
3. Next, choose a field for sorting or filtering, such as `id`, `type`, `exchange`, `symbol`, `name`, `price`, `volume`, `createdAt`.
4. Then, select an action: sorting, filtering, or change percentage. Options include:
   - For numbers: `sort desc`, `sort asc`, `filter min`, `filter max`, `change %`.
   - For strings: `filter`.
   - Sorting is available for both types.
5. If `change %` is selected, choose an interval: `change5s`, `10s`, `15s`, `30s`, `1 min`, `1 hour`.
6. Finally, decide whether to continue adding options or save the configuration. The bot will then start listening for changes.

## AI Integration

The bot supports AI-powered message processing using OpenAI's GPT. When creating a configuration, you can:

1. Enable AI processing
2. Provide a custom prompt for message formatting
3. The bot will process all messages through the AI before sending

This allows for:
- Natural language reformatting
- Content enhancement
- Custom message styling

## Message Customization

Each configuration supports several message formatting options:

- **Custom Templates**: Use your own template files for message formatting
- **Message Suffix**: Add custom text at the end of each message
- **Message Delay**: Set a custom delay (timeout) before sending messages
- **Destination Options**:
  - Private Messages: Send to individual users
  - Channel Messages: Send to Telegram channels
    - Supports both channel usernames (@channel) and channel IDs
    - Requires bot to be channel admin

## Key Features

- **Sorting**: Ability to sort data in ascending or descending order.
- **Filtering**: Set minimum and maximum values for data filtering.
- **Change Tracking**: Ability to track data changes in real-time.

## Contribution

If you want to contribute to the project, please fork the repository and submit a pull request with your changes.

## License

This project is licensed under the MIT License.
