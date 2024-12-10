VOLUME_PATH := $(shell pwd)

DOCKER_IMAGE_NAME = crypto-bot-tg
DOCKER_CONTAINER_NAME = crypto-bot-tg

include .env
export $(shell sed 's/=.*//' .env)

# Production commands
build:
	docker build -t $(DOCKER_IMAGE_NAME) .

run:
	docker run --restart=on-failure --name $(DOCKER_CONTAINER_NAME) -v $(PWD)/var:/var --env-file .env -d $(DOCKER_IMAGE_NAME)

# Development commands
build-dev:
	docker build --target development -t $(DOCKER_IMAGE_NAME):dev .

dev: build-dev
	docker run --rm \
		--name $(DOCKER_CONTAINER_NAME)-dev \
		-v $(PWD):/app \
		-v /app/node_modules \
		--env-file .env \
		-e NODE_ENV=development \
		-p 3000:3000 \
		$(DOCKER_IMAGE_NAME):dev

# Common commands
stop:
	docker stop $(DOCKER_CONTAINER_NAME) && docker rm $(DOCKER_CONTAINER_NAME) || true

stop-dev:
	docker stop $(DOCKER_CONTAINER_NAME)-dev || true

pull:
	git pull

update: pull stop build run

# Clean commands
clean:
	docker rmi $(DOCKER_IMAGE_NAME) || true
	docker rmi $(DOCKER_IMAGE_NAME):dev || true

.PHONY: build run build-dev dev stop stop-dev pull update clean
