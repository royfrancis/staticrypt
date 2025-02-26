FROM node:23-alpine3.20
LABEL authors="Roy Francis"
LABEL desc="Encrypts static HTML files and adds a password login"
LABEL org.opencontainers.image.source="https://github.com/royfrancis/staticrypt"

RUN apk add bash
COPY . /home/staticrypt
WORKDIR /home/staticrypt
RUN npm install -g
WORKDIR /home/work
CMD ["staticrypt", "--version"]

## docker buildx build --platform=linux/arm64,linux/amd64 -t ghcr.io/royfrancis/staticrypt:3.5.3.1 -t ghcr.io/royfrancis/staticrypt:latest --push -f Dockerfile .
## docker pull ghcr.io/royfrancis/staticrypt:3.5.3.1
## docker run --rm -v $PWD:/home/work ghcr.io/royfrancis/staticrypt:3.5.3.1 staticrypt index.html -p mylongpassword
