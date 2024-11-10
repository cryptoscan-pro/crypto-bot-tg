DOCKER_IMAGE_NAME = crypto-bot-tg
DOCKER_CONTAINER_NAME = crypto-bot-tg

include .env
export $(shell sed 's/=.*//' .env)

build:
	docker build -t $(DOCKER_IMAGE_NAME) .

run:
	docker run --name $(DOCKER_CONTAINER_NAME) --env-file .env -d $(DOCKER_IMAGE_NAME)

stop:
	docker stop $(DOCKER_CONTAINER_NAME) && docker rm $(DOCKER_CONTAINER_NAME)

update:
	git pull
	make stop
	make build
	make run
DOCKER_IMAGE_NAME = crypto-bot-tg
DOCKER_CONTAINER_NAME = crypto-bot-tg

# Загружаем переменные из .env файла
include .env
export $(shell sed 's/=.*//' .env)

# Команда для сборки Docker образа
build:
	docker build -t $(DOCKER_IMAGE_NAME) .

# Команда для запуска контейнера
run:
	docker run --name $(DOCKER_CONTAINER_NAME) --env-file .env -d $(DOCKER_IMAGE_NAME)

# Команда для остановки контейнера
stop:
	docker stop $(DOCKER_CONTAINER_NAME) && docker rm $(DOCKER_CONTAINER_NAME)

# Команда для обновления приложения
update:
	git pull
	make stop
	make build
	make run
