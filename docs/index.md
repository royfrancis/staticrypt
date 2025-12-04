---
layout: home
hero:
    name: "🔒 StatiCrypt"
    text: "Lock down static sites with client-side AES encryption"
    tagline: "Turn any HTML file into a password-gated experience powered entirely by WebCrypto."
    actions:
        - theme: brand
          text: Get Started
          link: /usage
        - theme: alt
          text: View on GitHub
          link: https://github.com/royfrancis/staticrypt
features:
    - title: Zero Backend
      details: "Encrypt content ahead of time and ship a self-decrypting HTML file that never needs a server round-trip."
    - title: Strong Crypto Defaults
      details: "Uses WebCrypto AES-CBC plus 600k PBKDF2 iterations spread across compatibility rounds."
    - title: Flexible Delivery
      details: "Share auto-decrypt links, remember users locally, or drop the encrypted HTML into any hosting provider."
---

## Why StatiCrypt?

StatiCrypt bundles your HTML and assets into a single password-protected page. Users enter a passphrase, the browser derives the same salted hash you used during encryption, and the decrypted experience replaces the placeholder layout—no backend or API keys required.

- **Client-side only:** Nothing secret leaves the visitor's device; the hashed password can optionally stay in `localStorage` when "Remember me" is enabled.
- **Portable artifact:** Host the encrypted file on GitHub Pages, S3, Netlify, or even email it as an attachment—it's just HTML.
- **Automation friendly:** A single CLI command can encrypt individual files or entire directory trees.

## Quick Encrypt Example

```bash
# Encrypt example/index.html into ./encrypted
staticrypt example/index.html --password "super-long-password"
```

![](/images/preview.webp)

StatiCrypt injects a polished password prompt (`lib/password_template.html`) plus an inline copy of the crypto runtime. Custom templates are supported for brand-conscious deployments. To see an encrypted page in action, check out the [demo page](https://royfrancis.github.io/staticrypt/example.html). Use password `mylongpassword`.

## User Guide & CLI Reference

Refer to the [User guide](/guide) for installation and examples of usage. Refer to [Reference](/reference) for a complete list of flags and options.

## Acknowledgements

This project is built on [StatiCrypt](https://github.com/robinmoisson/staticrypt/) by Robin Moisson.
