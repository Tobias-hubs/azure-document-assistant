FROM node:20-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends poppler-utils \ 
    && rm -rf /var/lib/apt/lists/*

    WORKDIR /app 
    COPY package.json ./ 
    RUN npm install
    COPY server.js ./ 

EXPOSE 7070
CMD ["node", "server.js"]
