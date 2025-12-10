# Multi-stage build for Next.js + Socket.IO Bingo Game
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json ./
RUN npm install

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js application with environment variables
ENV NEXT_PUBLIC_SOCKET_URL=${NEXT_PUBLIC_SOCKET_URL}
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Build-time args with defaults to avoid UndefinedVar warnings
ARG PORT=3000
ARG HOSTNAME=0.0.0.0
ARG NEXT_PUBLIC_SOCKET_URL=http://localhost:3000

# Set runtime env from build args (can still be overridden by docker run / compose)
ENV NODE_ENV=production
ENV PORT=${PORT}
ENV HOSTNAME=${HOSTNAME}
ENV NEXT_PUBLIC_SOCKET_URL=${NEXT_PUBLIC_SOCKET_URL}

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy package.json and install production dependencies
COPY --from=builder /app/package.json ./
RUN npm install --only=production && npm cache clean --force

# Copy the public folder and Next output
COPY --from=builder /app/public ./public
RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy custom server and utils
COPY --from=builder --chown=nextjs:nodejs /app/server.js ./
COPY --from=builder --chown=nextjs:nodejs /app/utils ./utils

# Expose port (informational). Uses PORT value set above.
EXPOSE ${PORT}

# Start the application with custom server
USER nextjs
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
