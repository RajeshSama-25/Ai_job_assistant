# AI Job Assistant — single-container image.
# Serves both the API and the static frontend (backend/server.js serves ../frontend).

FROM node:20-slim

# Playwright needs its own system libraries for headless Chromium (auto-fill feature).
WORKDIR /app

COPY backend/package.json backend/package-lock.json ./backend/
RUN cd backend && npm install --omit=dev

# Install just the Chromium browser + OS deps Playwright needs.
RUN cd backend && npx playwright install --with-deps chromium

COPY backend ./backend
COPY frontend ./frontend

WORKDIR /app/backend

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "server.js"]
