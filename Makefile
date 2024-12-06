DOCKER_IMAGE_NAME = crypto-bot-tg
DOCKER_CONTAINER_NAME = crypto-bot-tg

include .env
export $(shell sed 's/=.*//' .env)

build:
	docker build -t $(DOCKER_IMAGE_NAME) .

run:
	docker run --restart=on-failure --name $(DOCKER_CONTAINER_NAME) --env-file .env -d $(DOCKER_IMAGE_NAME)

stop:
	docker stop $(DOCKER_CONTAINER_NAME) && docker rm $(DOCKER_CONTAINER_NAME) || true

pull:
	git pull

update: pull stop build stop run
