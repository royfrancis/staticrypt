Docker definition for StatiCrypt

The docker image is built by Github actions and pushed to GHCR. So there is not need to run any of the below commands unless you want to test locally.

Build for local testing:

```
docker build -t ghcr.io/royfrancis/staticrypt:test -f docker/dockerfile .
```

Build and push multi-arch image to GHCR:

```
## run in the repo root
docker buildx create --name staticrypt-builder --bootstrap --use
docker buildx build \
  --platform=linux/arm64,linux/amd64 \
  -t ghcr.io/royfrancis/staticrypt:3.5.4.2 \
  -t ghcr.io/royfrancis/staticrypt:latest \
  --push \
  -f docker/dockerfile .
docker buildx rm staticrypt-builder
```

Pull and run container:

```
docker pull ghcr.io/royfrancis/staticrypt:latest
docker run --rm -v $PWD:/home/work ghcr.io/royfrancis/staticrypt:latest staticrypt example/index.html -p mylongpassword
```
