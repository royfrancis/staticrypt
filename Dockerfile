FROM node:gallium-alpine3.17
LABEL authors = "Roy Francis"
LABEL org.opencontainers.image.source = "https://github.com/royfrancis/staticrypt"

RUN mkdir /home/staticrypt /home/work
COPY . /home/staticrypt
WORKDIR /home/staticrypt
RUN npm install -g
WORKDIR /home/work
CMD ["staticrypt", "--version"]

## docker build -t staticrypt:gallium-alpine3.17 .
## docker tag staticrypt:gallium-alpine3.17 ghcr.io/royfrancis/staticrypt:gallium-alpine3.17
## docker push ghcr.io/royfrancis/staticrypt:gallium-alpine3.17
## docker run --rm -v $PWD:/home/work ghcr.io/royfrancis/staticrypt:gallium-alpine3.17 staticrypt index.html -p mypassword

