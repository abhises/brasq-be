FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# generate does not connect; prisma.config.ts only needs the variable to exist
RUN DATABASE_URL=postgres://build:build@localhost:5432/build npx prisma generate && npm run build && npm prune --omit=dev

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts /app/package.json ./
EXPOSE 4000
# Apply pending migrations, then start the API
# exec so node receives SIGTERM and shuts down cleanly when a release is stopped
CMD ["sh", "-c", "npx prisma migrate deploy && exec node dist/server.js"]
