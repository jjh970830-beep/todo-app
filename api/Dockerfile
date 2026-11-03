# API 이미지: Express 서버
FROM node:20-alpine

WORKDIR /app

# package*.json 만 먼저 복사해서, 코드만 바뀌었을 때는 npm ci 단계를 캐시로 건너뜁니다.
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# root 대신 이미지에 들어 있는 node 사용자로 실행
USER node

EXPOSE 3000
CMD ["node", "src/index.js"]
