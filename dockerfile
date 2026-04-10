from node:22-alpine AS builder

workdir /app

copy package*.json ./
copy tsconfig.json ./

run npm ci

copy . .

run npm run build 

from node:22-alpine

workdir /app

copy package*.json ./

run npm ci --only=production

copy --from=builder /app/build ./build

expose 3000 

cmd ["node" , "build/server.js"]


