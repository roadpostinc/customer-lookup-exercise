FROM node:24.19.0-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY mocks ./mocks
CMD ["./node_modules/.bin/tsx", "mocks/server.ts"]
