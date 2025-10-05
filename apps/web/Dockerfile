FROM node:22-alpine AS deps

WORKDIR /app
COPY package*.json ./
# Install all dependencies for building
RUN npm ci

FROM node:22-alpine AS builder

WORKDIR /app
# Copy all dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]