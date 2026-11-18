FROM node:24-alpine3.22 AS base
WORKDIR /app
RUN npm install -g pm2
COPY . .
RUN npm install
EXPOSE 4501
CMD ["pm2-runtime", "start", "./bin/www", "--name", "AMVC_Testing"]