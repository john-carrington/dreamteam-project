FROM node:20.19-alpine3.22 AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build 

FROM nginx:alpine3.22
COPY --from=build /app/dist /usr/share/nginx/html