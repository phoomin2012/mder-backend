FROM node:14

WORKDIR /app

COPY ["package.json", "package-lock.json*", "yarn.lock", "./"]

RUN npm i -g npm

RUN npm i -g yarn --force

RUN yarn install --production

COPY . .

EXPOSE 3001

# start command
CMD [ "node", "app" ]
