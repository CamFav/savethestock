FROM node:22-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS dev
ENV VITE_PORT=5173
ENV VITE_API_BASE_URL=
ENV VITE_API_TIMEOUT_MS=15000
ENV VITE_PROXY_TARGET=http://backend:8080
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

FROM base AS build
ARG VITE_API_BASE_URL=
ARG VITE_API_TIMEOUT_MS=15000
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_API_TIMEOUT_MS=${VITE_API_TIMEOUT_MS}
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS prod
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
