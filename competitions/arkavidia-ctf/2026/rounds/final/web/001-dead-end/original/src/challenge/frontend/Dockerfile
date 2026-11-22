FROM node:20-alpine

WORKDIR /app

COPY package.json .
RUN npm install

COPY app.js .
COPY public/ ./public/

# Drop privileges to the non-root 'node' user built into the image
USER node

EXPOSE 3000
CMD ["npm", "start"]