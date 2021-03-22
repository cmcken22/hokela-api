FROM node:9.4.0-alpine
ENV PORT 4000

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install

COPY . .
RUN apk update && apk add bash && apk add --update coreutils && apk --no-cache add curl
RUN npm run gen

EXPOSE 4000
CMD [ "npm", "run", "start:prod" ]
