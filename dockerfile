FROM node:20-slim
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl
COPY package*.json ./
RUN npm install
COPY . .

# Generate Prisma client in the correct location
RUN npx prisma generate

# Build the application
RUN npm run build


EXPOSE 3000
CMD ["npm","run","start"]