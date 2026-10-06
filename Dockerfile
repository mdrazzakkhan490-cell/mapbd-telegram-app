FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json bun.lock ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]
