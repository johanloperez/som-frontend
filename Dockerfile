ARG APP=core

FROM node:22-alpine AS build
WORKDIR /app
COPY . .
RUN npm ci
RUN npx turbo build --filter=${APP}-web

FROM node:22-alpine
WORKDIR /app
ARG APP=core
COPY --from=build /app/apps/${APP}/.next/standalone .
COPY --from=build /app/apps/${APP}/.next/static ./.next/static
COPY --from=build /app/apps/${APP}/public ./public 2>/dev/null || true

ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]
