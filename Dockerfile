FROM node:gallium-alpine3.17
LABEL authors = "Roy Francis"
LABEL desc = "Encrypts static HTML files and adds a password login"
LABEL org.opencontainers.image.source = "https://github.com/royfrancis/staticrypt"

RUN mkdir /home/staticrypt /home/work
COPY . /home/staticrypt
WORKDIR /home/staticrypt
RUN npm install -g
WORKDIR /home/work
CMD ["staticrypt", "--version"]

## docker build -t staticrypt:3.1.0 .
## docker tag staticrypt:3.1.0 ghcr.io/royfrancis/staticrypt:3.1.0
## docker push ghcr.io/royfrancis/staticrypt:3.1.0
## docker run --rm -v $PWD:/home/work ghcr.io/royfrancis/staticrypt:3.1.0 staticrypt index.html -p mypassword

