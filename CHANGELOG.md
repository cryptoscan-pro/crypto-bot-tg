## [1.7.1](https://github.com/cryptoscan-pro/crypto-bot-tg/compare/v1.7.0...v1.7.1) (2024-12-22)


### Bug Fixes

* **index.ts:** update messageOptions parse_mode from 'Markdown' to 'MarkdownV2' for improved formatting capabilities ([837d9ea](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/837d9ea160aa87e94fd9b74ae56771735c048f28))

# [1.7.0](https://github.com/cryptoscan-pro/crypto-bot-tg/compare/v1.6.1...v1.7.0) (2024-12-22)


### Features

* Add support for custom message templates via default export ([7c8ef77](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/7c8ef776f086643c08e80272f85b3774b9a0aa42))

## [1.6.1](https://github.com/cryptoscan-pro/crypto-bot-tg/compare/v1.6.0...v1.6.1) (2024-12-22)


### Bug Fixes

* **clearMessage.ts:** remove unnecessary replacements in clearMessage function to simplify the code and improve readability ([4442e24](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/4442e24a0bef57a9715acfa910f3372c0e345807))

# [1.6.0](https://github.com/cryptoscan-pro/crypto-bot-tg/compare/v1.5.1...v1.6.0) (2024-12-22)


### Features

* **index.ts:** enhance message sending by adding error handling and session management ([8eadc94](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/8eadc9492494fcd0030fce733e91b66f6ee48383))

## [1.5.1](https://github.com/cryptoscan-pro/crypto-bot-tg/compare/v1.5.0...v1.5.1) (2024-12-22)


### Bug Fixes

* **deploy.yml:** update GitHub token secret from GITHUB_TOKEN to GH_TOKEN for Docker login compatibility ([30edcbe](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/30edcbee3e2cdedafa5e01d597d091c59c548f2f))

# [1.5.0](https://github.com/cryptoscan-pro/crypto-bot-tg/compare/v1.4.0...v1.5.0) (2024-12-22)


### Features

* **workflows:** add GitHub Actions workflows for Docker publishing, deployment, and Telegram notifications to automate CI/CD processes ([acdfc9c](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/acdfc9c0ef3eb7dac15aabdd76970774fce2819c))

# [1.4.0](https://github.com/cryptoscan-pro/crypto-bot-tg/compare/v1.3.0...v1.4.0) (2024-12-21)


### Features

* Wrap all Telegram messages with clearMessage() function ([53477e7](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/53477e7a40cce0e5a2ebcf74934d00f21e3449f2))

# [1.3.0](https://github.com/cryptoscan-pro/crypto-bot-tg/compare/v1.2.0...v1.3.0) (2024-12-21)


### Features

* Add error handling and logging for message sending ([4f26d57](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/4f26d57664a961220684d0e6be15a74c6383bd81))

# [1.2.0](https://github.com/cryptoscan-pro/crypto-bot-tg/compare/v1.1.0...v1.2.0) (2024-12-16)


### Features

* upgrade ws-reconnect version ([c2c244a](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/c2c244a2a9493ddc22611dbd4d9b26d5e17c6126))

# [1.1.0](https://github.com/cryptoscan-pro/crypto-bot-tg/compare/v1.0.0...v1.1.0) (2024-12-15)


### Features

* add GitHub Actions workflow to sync README.md to target repository ([f21aa63](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/f21aa6350cf5e5e3cb2a364fe25510e431a63386))

# 1.0.0 (2024-12-10)


### Bug Fixes

* Add missing command handler for /send ([3ec2ae0](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/3ec2ae0d68490c0fa691be85a4dcde17151801cb))
* Add missing type and variable declarations in src/index.ts ([104e8e9](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/104e8e9b9688d4bfdfc8ec1b15f32f7f6112646b))
* Add suffix support to message handling ([11d2856](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/11d28569ca2f0055531bd82242fc2e4a1d3bc0f3))
* Add validation for destination before saving configuration ([012fe36](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/012fe366506556aeab454bda9e8362d3c0504bc1))
* Check isActive status before starting websocket connections in bot.launch() ([337c700](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/337c700e426668db138a22b85bcda5df039c14f6))
* Correct SEARCH/REPLACE block to match existing lines in index.ts ([dca9380](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/dca9380b2256155490907ed79bfd3e74ebc70149))
* Ensure proper session handling in percentage change flow ([fc95e94](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/fc95e94aed3c8cb144f0913a731f371b9fa67f55))
* fix encoding issue in import statement ([3d8e61e](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/3d8e61ed474e161769baec992956dbf00b427e5f))
* Fix SEARCH/REPLACE block for 'channel_id' case in src/index.ts ([c7900c7](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/c7900c764ff5d7f34f4d771157369379f6676d9f))
* **getData.ts:** correct type annotation for result variable to ApiResponse<T[]> for accurate type handling ([76803ae](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/76803ae713ea59df36a86fb05afe35192761f97c))
* handle AI processing failure gracefully ([d1dcb80](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/d1dcb80cbcf2a1ad6b27107ce1d9b340dee52a97))
* handle channel ID formats in text handler ([155dc18](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/155dc18c8d729db74143e07c3238ad838a1e6b5e))
* Handle different channel ID formats and improve error handling ([41ec5c2](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/41ec5c2c6ea8fc702ffc956eeb3188fdbd8120c2))
* handle missing destination in config ([fb22fde](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/fb22fdea22abd9a1cb6a8fc4f9148f8e000acf2d))
* handle missing message id in websocket response ([f507922](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/f5079221c731d2485f3a786c4b0f986442028a03))
* Handle undefined CLIENTS.get(userId) in listWebsockets ([3adaabf](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/3adaabf406dc6684589d432139dc17d039a98453))
* Implement menu-driven interface and websocket configuration management ([ac27783](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/ac27783e932afcbd18002cb0445c199cd1b65df3))
* Improve configuration flow and input handling ([966a1c9](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/966a1c9abbe6bbafd5d98b82d8ea8836f590ad2b))
* Improve error handling and comment removal in OpenAI service formatting ([0c2661c](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/0c2661c004f23279b014a9f0c28b5710e0534067))
* initialize query variable in type selection handler ([5367883](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/5367883ad7f877472839da40fc003181583e6fb1))
* **Makefile:** correct syntax in update target by removing the comma to ensure proper execution of commands ([012a8d0](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/012a8d040f681b301578dbc5f3220303391a7b97))
* Refactor text message handling using Telegraf's recommended approach ([5e414b8](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/5e414b818052b4fd092bb489de11274c72122c9b))
* remove `removeAllListeners()` from `stop()` function ([d66afa1](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/d66afa12b29c37636ae67e68811c1e25551e3ea6))
* Remove duplicate createMessageHandler function and add error handling for WebSocket messages ([2c85f8e](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/2c85f8e20b8943b4c64cfe8708eb45acf65d7b8b))
* remove existing handlers before setting up new ones in askContinueOrSave ([94e425e](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/94e425e57b425f5e8b6d31b5b362d7f2085ae044))
* remove misplaced code and fix syntax issues in askContinueOrSave function ([64a5bbc](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/64a5bbc0cbff51ccc32f20a8a9b2dc0781152308))
* Remove unnecessary comment in openaiService.ts and add typedoc ([57e8951](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/57e89513186666f27115f0c20045d21f38429e61))
* Replace English text with Russian and remove comments ([de15ebf](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/de15ebfda863294cda12c5516ba70bda7c25dcda))
* replace incorrect `removeAllListeners` calls with `bot.off()` to remove event listeners ([ea40202](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/ea40202309ebc72bbc19b2e59715eff5b63fb92c))
* Restructure askContinueOrSave function to fix syntax error ([aa2f3dd](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/aa2f3dd3721ba9d77cb61f5c22335aac2e6aee6f))
* translate messages and buttons to Russian in src/index.ts ([b5402aa](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/b5402aab0c53fb24cde15749904e542e0720cc2d))
* translate russian to english and remove code comments ([cee72e9](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/cee72e902840bba724a5825e658237893ba47320))
* update "Select data type to modify:" to "Выберите тип данных:" ([76d9289](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/76d9289bf1110ad404287304f8fcfa589bf63099))


### Features

* **.gitignore:** add clients.json to ignore list to prevent sensitive data exposure ([4d58ebb](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/4d58ebb2cbc1258fb0bad978c2622879b9cab21b))
* add AI processing option during configuration creation ([41710bd](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/41710bd2e748f1ba0495c57ddb4500e552df7fef))
* Add back button and prepare for configuration naming in askContinueOrSave.ts ([905ac98](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/905ac984b8d079eb24a2a49cc0da9a8601dbda19))
* Add build dependency to dev target in Makefile ([2b16e68](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/2b16e683ed490a34f69b32cf99e1318abc2cd4c4))
* add channel/private message notification choice ([41f4178](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/41f4178baa2db1de8b6726886388dedbd10cd8ae))
* Add development mode commands to Makefile ([9d0ba12](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/9d0ba126057ea9c4c6b86f2a22d2fe9d32189051))
* add disable_web_page_preview option to Telegram messages ([d37b99a](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/d37b99a42f83ce7542f985c48cc5f6b92546c129))
* Add Docker support with Makefile and .env file integration ([8e2c24c](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/8e2c24c78d5ac72a410c9f1826ed409eb989bc88))
* Add Dockerfile for Node.js application setup ([4032c1d](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/4032c1dc8acc32a68dab25ef59424de8724c6720))
* add error handling and logging to message sending ([d0c9b16](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/d0c9b163676b90508df6ee968ac3d127fe882151))
* add functionality to select data destination and handle configuration saving ([8c07ca6](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/8c07ca68ccf3d1bb5eeeedd947a55ab605c4bb86))
* add getStringSession script ([8069d51](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/8069d51b30a4d81f66f59e81ccd616a1fd775eac))
* Add getStringSession utility ([2b71efc](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/2b71efc211614298c863b2295559cf0015fede48))
* Add logging to createMessageHandler function ([0642fa9](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/0642fa9d6ce1e29304caf2e8de955bcfffcf4c5d))
* Add message deduplication mechanism with 1-minute window ([936b9f8](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/936b9f8c32014f16d1aa4ab1cffe3b398e7169f3))
* add message parsing to Telegram bot ([3736811](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/373681138d382c9e9b89dc7e3f290307b9e35837))
* Add multi-stage Dockerfile and docker-compose for dev/prod environments ([4d7519d](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/4d7519d770d2974c92c59d12a4507d969faff60d))
* add new types and utility functions ([2a958d1](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/2a958d1d738a15a56520ad2987eb78d4fd8fe4dd))
* Add OpenAI service ([9fd988e](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/9fd988e623b42e5cb128ad14a98608da8fac0ce6))
* Add percentage change fields to the list of available columns ([a692eba](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/a692ebab94860eaceec78a7c67e8d8d125f75eaa))
* add query parameter editing functionality ([077c2a0](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/077c2a0795a35e2cb2c05d4945001e5ec3462ab8))
* Add script to get Telegram string session ([bf8cb77](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/bf8cb77d93e1d33f5b2756bea8f04c7b638c5662))
* add session middleware to Telegram bot ([7b6dff5](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/7b6dff55e07bfc0f2b484b3a929caf8beb82bb1e))
* add suffix and timeout handlers ([71a845c](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/71a845c073af7f1d7e665851dab2c9b37b10814e))
* Add template path support for message formatting ([3c19709](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/3c1970996acb42066e725f822c958e72c3290647))
* Add timeout option to configuration ([1138be1](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/1138be121f407d289667a6a3fa93cb8a8e3b2f5b))
* add type safety and error handling to getData utility ([7a79d4a](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/7a79d4a48b069c6da9c44c08280e9cdb640a74ff))
* Add WebSocketConfig type and related utilities ([18cca1f](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/18cca1fd9a391a8fa1d8bc691791d1de5bee28db))
* delete test ([bbb25c1](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/bbb25c1e32599f4b3a878ce9682527976aa80055))
* **devcontainer:** add custom DevContainer configuration for development environment ([8f8d3a6](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/8f8d3a6dab544681712592ab38b1b7ac4a31e4b7))
* **docker:** add .dockerignore and .env.example files for better configuration management ([74938aa](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/74938aa1fa3dd3aa263a1a32ee538f15dc4c513c))
* **getData.ts:** add quota check for API responses to handle exceeded limits and provide user guidance ([0abfc7f](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/0abfc7f7981aa1da4874318d4dcaa06cf7fd42eb))
* Implement interactive data selection and filtering for bot users ([3d113b8](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/3d113b81f838bc2ca2026d8e14e8e0d232edbd50))
* initialize crypto-bot-tg project with basic structure and dependencies ([90eb858](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/90eb858571aa2cfe83445a8460284861a636b4f7))
* Localize button texts and error messages in src/index.ts ([1340712](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/1340712cab78e40f2122306fa421af416a079298))
* **package.json:** add dotenv package to manage environment variables more effectively ([80106cd](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/80106cd30de3a01695629f03ecc3c6f898eeb4b3))
* **package.json:** add telegramify-markdown package to enhance message formatting for Telegram ([8bba17f](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/8bba17f89f8111e50ae0279201b44f89ff10ab12))
* **release:** add GitHub Actions workflow for automated releases ([196ddd5](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/196ddd5c51b1de18a20b8f24285f46163adbe9e8))
* Remove console.log from Telegram bot ([f913cca](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/f913cca5c23bb3ab17feef7c8a09054d1f35de76))
* Show field selection menu on 'continue' action ([726a2b4](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/726a2b40b15e09f0e7eaec32971d75ba4fb61d4c))
* Translate button labels and messages from Russian to English ([ccc086e](https://github.com/cryptoscan-pro/crypto-bot-tg/commit/ccc086e1b77926eb672d2121f4db732a0b93d0f6))
