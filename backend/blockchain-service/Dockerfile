FROM node:18
RUN apt update
RUN apt install -y imagemagick ghostscript
# Create app directory
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --omit=dev

# Bundle app source
COPY ../../.env . 
COPY . .
EXPOSE 3000
ENTRYPOINT [ "/usr/src/app/entrypoint.sh" ]
CMD [ "node", "index.js" ]