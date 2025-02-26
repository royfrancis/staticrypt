# StatiCrypt :lock:

![preview](preview.webp)

Password Protect HTML Pages with StatiCrypt.

## 1. Usage

**Flags**

Some important flags:

- `-p` Password to unlock the encrypted page
- `-d` Name of output directory for encrypted files. `-d .` denotes output into current directory which means overwrite input file
- `-r` Recursively encrypt all HTML files

### 1.1 Using Docker

- Fetch the docker image

```
docker pull ghcr.io/royfrancis/staticrypt:latest
```

- Navigate to the directory with the html file to encrypt and run as below. This outputs **index.html** into a folder

```
docker run --rm -v $PWD:/home/work ghcr.io/royfrancis/staticrypt:latest staticrypt index.html -p mylongpassword
```

Alternatively, password can be defined inside an **.env** file like this:

```
STATICRYPT_PASSWORD="mylongpassword"
```

and then run;

```
docker run --rm -v $PWD:/home/work ghcr.io/royfrancis/staticrypt:latest staticrypt index.html
```

- To overwrite **index.html** with encrypted version;

```
docker run --rm -v $PWD:/home/work ghcr.io/royfrancis/staticrypt:latest staticrypt index.html -d . -p mylongpassword
```

- Encrypt multiple files;

```
docker run --rm -v $PWD:/home/work ghcr.io/royfrancis/staticrypt:latest staticrypt index.html index2.html -d . -p mylongpassword
```

- To recursively encrypt all files in a folder and output to another folder;

```
docker run --rm -v $PWD:/home/work ghcr.io/royfrancis/staticrypt:latest staticrypt path/to/folder -r -p mylongpassword
```

- To recursively encrypt all files in a folder and overwrite;

```
docker run --rm -v $PWD:/home/work ghcr.io/royfrancis/staticrypt:latest staticrypt path/to/folder/* -r -d . -p mylongpassword

# for current directory
docker run --rm -v $PWD:/home/work ghcr.io/royfrancis/staticrypt:latest staticrypt * -r -d . -p mylongpassword
```

- For more options, 

```
docker run --rm ghcr.io/royfrancis/staticrypt:latest staticrypt --help
```

#### 1.1.1 Adding links

:bulb: To add a link to a repo along with the title, see below.

<details>
<summary>Show more</summary>

![](preview-repo.webp)

Replace URL in `href`. The default SVG is GitHub. Note that this command recursively overwrites all HTML files.

```
docker run --rm -v $PWD:/home/work ghcr.io/royfrancis/staticrypt:latest staticrypt path/to/folder/* -r -d . -p mylongpassword --template-title "NBIS Support&nbsp<a href='https://github.com/royfrancis/staticrypt' target='_blank'><svg width='30' height='30' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 496 512'><path d='M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z'/></svg></a>"
```

</details>

### 1.2 Using GitHub Actions

GA encrypts all HTML files, commits the changes and pushes the changes back.

See [gh-pages branch](https://github.com/royfrancis/staticrypt/tree/gh-pages) for an example.

- Copy the github action and set **push:branches** and **env:branch** as needed
- Input password into **.env** file OR create an environment variable `STATICRYPT_PASSWORD`
- Add environment variable `TOKEN` to push changes back
- Optionally, add a badge for the job

### 1.3 Using NodeJS

- Prepare an environment with NodeJS

```
conda create -n nodejs nodejs=22.13.0 -c conda-forge
conda activate nodejs
```

- Clone the repo and install the required NPM packages

```
git clone https://github.com/royfrancis/staticrypt.git
git checkout bootstrap
npm install -g
```

- Navigate to the directory with the html file to encrypt
- The command overwrites **index.html** with encrypted version.

```
staticrypt index.html -p mylongpassword
```

For more options, `staticrypt --help`

## 2. Acknowledgements

- Built on [StatiCrypt](https://github.com/robinmoisson/staticrypt/)

---

2025 • Roy Francis
