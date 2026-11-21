# ---------- Dependencies stage ----------
FROM node:21 AS deps
WORKDIR /app

# Set shared Puppeteer cache dir
ENV PUPPETEER_CACHE_DIR=/var/cache/puppeteer
RUN mkdir -p /var/cache/puppeteer

COPY package*.json ./

RUN npm ci || npm install

RUN npx puppeteer browsers install firefox


# ---------- Runtime stage ----------
FROM node:21

ENV PUPPETEER_CACHE_DIR=/var/cache/puppeteer

RUN apt-get update -y && \
    apt-get install -y \
      ca-certificates \
      fonts-liberation \
      libasound2 \
      libatk1.0-0 \
      libc6 \
      libcairo2 \
      libcups2 \
      libdbus-1-3 \
      libexpat1 \
      libfontconfig1 \
      libgcc1 \
      libgdk-pixbuf2.0-0 \
      libglib2.0-0 \
      libgtk-3-0 \
      libnspr4 \
      libnss3 \
      libpango-1.0-0 \
      libpangocairo-1.0-0 \
      libstdc++6 \
      libx11-6 \
      libx11-xcb1 \
      libxcb1 \
      libxcomposite1 \
      libxcursor1 \
      libxdamage1 \
      libxext6 \
      libxfixes3 \
      libxi6 \
      libxrandr2 \
      libxrender1 \
      libxss1 \
      libxtst6 \
      wget \
      xdg-utils \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -ms /bin/bash bot

WORKDIR /home/bot/app

COPY --from=deps /app/node_modules ./node_modules

COPY --from=deps /var/cache/puppeteer /var/cache/puppeteer

COPY . .

# Permissions so bot can read everything
RUN chown -R bot:bot /home/bot /var/cache/puppeteer

USER bot

CMD ["node", "index.js"]
