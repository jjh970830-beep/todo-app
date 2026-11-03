# 웹 이미지: 1단계에서 React 를 빌드하고, 2단계에서 Nginx 가 결과물을 제공합니다.

# 1단계: 빌드 (node_modules 와 소스는 최종 이미지에 들어가지 않음)
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 2단계: Nginx
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
