# ==========================================
# STAGE 1: Build & Dependencies
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Prisma Client requires OpenSSL on Alpine.
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies needed for TypeScript compilation.
RUN npm ci

COPY . .

# Generate Prisma Client and compile TypeScript.
RUN npx prisma generate
RUN npm run build

# Remove development dependencies for the production image.
RUN npm prune --production

# ==========================================
# STAGE 2: Production Runner
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=5000

# Copy only runtime assets.
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Run as the non-root node user for safer production execution.
USER node

EXPOSE 5000

CMD ["node", "dist/server.js"]
