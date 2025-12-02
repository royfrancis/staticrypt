Docker definition for Staticrypt

Build and push multi-arch image:

```
## local build for testing
## docker build -t ghcr.io/royfrancis/staticrypt:test .

## run in the repo root
docker buildx create --name staticrypt-builder --bootstrap --use
docker buildx build \
  --platform=linux/arm64,linux/amd64 \
  -t ghcr.io/royfrancis/staticrypt:3.5.4.1 \
  -t ghcr.io/royfrancis/staticrypt:latest \
  --push \
  -f docker/dockerfile .
docker buildx rm staticrypt-builder
```

Pull and run container:

```
docker pull ghcr.io/royfrancis/staticrypt:3.5.4.1
docker run --rm -v $PWD:/home/work ghcr.io/royfrancis/staticrypt:3.5.4.1 staticrypt index.html -p mylongpassword
```
