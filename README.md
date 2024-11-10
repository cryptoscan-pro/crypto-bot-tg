# @cryptoscan/cryptobot-tg

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

Create a `.env` file based on `.env.example` and specify the necessary environment variables.

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

## Key Features

- **Sorting**: Ability to sort data in ascending or descending order.
- **Filtering**: Set minimum and maximum values for data filtering.
- **Change Tracking**: Ability to track data changes in real-time.

## Contribution

If you want to contribute to the project, please fork the repository and submit a pull request with your changes.

## License

This project is licensed under the MIT License.
