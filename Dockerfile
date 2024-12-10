# Base stage for both dev and prod
FROM node:18-alpine as base
WORKDIR /app
COPY package*.json ./
RUN npm install -g pnpm

# Development stage
FROM base as development
ENV NODE_ENV=development
RUN pnpm install
COPY . .
EXPOSE 3000
CMD ["pnpm", "dev"]

# Production stage
FROM base as production
ENV NODE_ENV=production
RUN pnpm install --prod
COPY . .
EXPOSE 3000
CMD ["pnpm", "start"]

# Default to production stage
FROM production
