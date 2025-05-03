FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Create the expected directory structure
RUN mkdir -p ./generated/prisma/client

# Generate Prisma client in the correct location
RUN npx prisma generate

# Build the application
RUN npm run build

# Ensure the generated client is copied to the dist folder
RUN cp -r ./generated ./dist/

EXPOSE 3000
CMD ["node", "dist/src/app.js"]