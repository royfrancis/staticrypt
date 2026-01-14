# CLI Reference

This section details all available command-line flags for the StatiCrypt tool. 

### Core

| Flag | Alias | Description |
| --- | --- | --- |
| `--help` | `-h` | Show the full CLI usage reference. |
| `--config <path>` | `-c` | Path to config file (default `.staticrypt.json`). Use `false` to skip config IO. |
| `--directory <dir>` | `-d` | Output directory for encrypted/decrypted files. Defaults to `encrypted` or `decrypted` when `--decrypt` is set. |
| `--decrypt` | — | Decrypt input files instead of encrypting. |
| `--password <value>` | `-p` | Provide the passphrase via CLI. When omitted, StatiCrypt prompts (or reads `STATICRYPT_PASSWORD`). |
| `--recursive` | `-r` | Encrypt every HTML/HTM file within provided directories; non-HTML files are copied untouched. |
| `--quiet` | `-q` | Suppress the success summary message (`Encrypted X files to ...`). |
| `--salt <hex>` | `-s` | Supply a custom salt. Passing `-s` without a value prints a freshly generated salt and exits. |
| `--short` | — | Suppresses the warning about short passwords (<14 chars). |

## Remember & Sharing

| Flag | Description |
| --- | --- |
| `--remember <days>` | Integer of days for the "Remember me" checkbox. `0` (default) means no expiration, `false` hides the checkbox entirely. |
| `--share [url]` | Emits `#staticrypt_pwd=<hash>` (and optional URL) for auto-decrypt links. If no URL is provided, only the hash fragment is printed. |
| `--share-remember` | Appends `&remember_me` to the share link so the recipient auto-enables remember-me during load. |

## Template Customization

| Flag | Description |
| --- | --- |
| `--template <path>` | Use a custom HTML template instead of `lib/password_template.html`. |
| `--template-button <text>` | Label for the decrypt button (default `Login`). |
| `--template-color-primary <hex>` | Primary accent color (default `#95b540`). |
| `--template-color-secondary <hex>` | Secondary/background color (default `#E9F2D1`). |
| `--template-image <path>` | Path/URL of an image shown with the login form; local files are inlined as base64 automatically. |
| `--template-image-position <top \| left>` | Choose whether the image sits above the card or to the left (default `top`). |
| `--template-image-height <css>` | Overrides the computed image height (`60px` for top, `100%` for left by default). |
| `--template-image-width <css>` | Overrides the computed image width (`100%` for top, `120px` for left by default). |
| `--template-image-focus <css>` | Sets the CSS `object-position` used to frame the image within its box (default `center`). |
| `--template-error <text>` | Alert shown when the passphrase is wrong.
| `--template-instructions <text>` | Paragraph displayed above the password field.
| `--template-placeholder <text>` | Placeholder text inside the password input.
| `--template-remember <text>` | Label for the remember-me checkbox.
| `--template-title <text>` | Main heading for the form (default `Protected page`).
| `--template-page-title <text>` | Document `<title>`; falls back to template title.
| `--template-subtitle <text>` | Optional subtitle under the title.
| `--template-subtitle-link <url>` | Link applied to the subtitle (ignored when subtitle text is empty).
| `--template-footer <text>` | Small footer text rendered below the form.
| `--template-footer-link <url>` | Link applied to the footer (ignored when footer text is empty).
| `--template-toggle-show <text>` | Accessible label for the "show password" action.
| `--template-toggle-hide <text>` | Accessible label for the "hide password" action.
