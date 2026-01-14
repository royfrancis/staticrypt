#!/usr/bin/env node

"use strict";

// check node version before anything else
const nodeVersion = process.versions.node.split(".");
if (nodeVersion[0] < 16) {
    console.log("ERROR: Node version 16 or higher is required.");
    process.exit(1);
}

// parse .env file into process.env
require("dotenv").config();

const pathModule = require("path");
const fs = require("fs");

const cryptoEngine = require("../lib/cryptoEngine.js");
const codec = require("../lib/codec.js");
const { generateRandomSalt } = cryptoEngine;
const { decode, encodeWithHashedPassword } = codec.init(cryptoEngine);
const {
    OUTPUT_DIRECTORY_DEFAULT_PATH,
    buildStaticryptJS,
    exitWithError,
    genFile,
    getConfig,
    getFileContent,
    getPassword,
    getValidatedSalt,
    isOptionSetByUser,
    parseCommandLineArguments,
    recursivelyApplyCallbackToHtmlFiles,
    validatePassword,
    writeConfig,
    writeFile,
    getFullOutputPath,
} = require("./helpers.js");

const TEMPLATE_IMAGE_MIME_TYPES = {
    ".apng": "image/apng",
    ".avif": "image/avif",
    ".bmp": "image/bmp",
    ".gif": "image/gif",
    ".ico": "image/x-icon",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".tif": "image/tiff",
    ".tiff": "image/tiff",
    ".webp": "image/webp",
};

// parse arguments
const yargs = parseCommandLineArguments();
const namedArgs = yargs.argv;

async function runStatiCrypt() {
    const hasSaltFlag = isOptionSetByUser("s", yargs);
    const hasShareFlag = isOptionSetByUser("share", yargs);

    const positionalArguments = namedArgs._;

    // require at least one positional argument unless some specific flags are passed
    if (!hasShareFlag && !(hasSaltFlag && !namedArgs.salt)) {
        if (positionalArguments.length === 0) {
            console.log("ERROR: Invalid number of arguments. Please provide an input file.\n");

            yargs.showHelp();
            process.exit(1);
        }
    }

    const missingInputPath = positionalArguments.find((inputPath) => !fs.existsSync(inputPath));
    if (missingInputPath) {
        exitWithError(`Input path "${missingInputPath}" does not exist.`);
    }

    // get config file
    const configArg = typeof namedArgs.config === "string" ? namedArgs.config : ".staticrypt.json";
    const configPath = configArg.toLowerCase() === "false" ? null : pathModule.resolve(process.cwd(), configArg);
    const config = getConfig(configPath);

    // if the 's' flag is passed without parameter, generate a salt, display & exit
    if (hasSaltFlag && !namedArgs.salt) {
        const generatedSalt = generateRandomSalt();

        // show salt
        console.log(generatedSalt);

        // write to config file if it doesn't exist
        if (!config.salt) {
            config.salt = generatedSalt;
            writeConfig(configPath, config);
        }

        return;
    }

    // get the salt & password
    const salt = getValidatedSalt(namedArgs, config);
    const password = await getPassword(namedArgs.password);
    const hashedPassword = await cryptoEngine.hashPassword(password, salt);

    // display the share link with the hashed password if the --share flag is set
    if (hasShareFlag) {
        await validatePassword(password, namedArgs.short);

        let url = namedArgs.share || "";
        url += "#staticrypt_pwd=" + hashedPassword;

        if (namedArgs.shareRemember) {
            url += `&remember_me`;
        }

        console.log(url);
        return;
    }

    // only process a directory if the --recursive flag is set
    const directoriesInArguments = positionalArguments.filter((path) => fs.statSync(path).isDirectory());
    if (directoriesInArguments.length > 0 && !namedArgs.recursive) {
        exitWithError(
            `'${directoriesInArguments[0].toString()}' is a directory. Use the -r|--recursive flag to process directories.`
        );
    }

    // if asking for decryption, decrypt all the files
    if (namedArgs.decrypt) {
        const isOutputDirectoryDefault =
            namedArgs.directory === OUTPUT_DIRECTORY_DEFAULT_PATH && !isOptionSetByUser("d", yargs);
        const outputDirectory = isOutputDirectoryDefault ? "decrypted" : namedArgs.directory;
        const decryptTasks = [];
        let decryptedFileCount = 0;
        let decryptedOverwroteInputs = false;

        positionalArguments.forEach((path) => {
            recursivelyApplyCallbackToHtmlFiles(
                (fullPath, fullRootDirectory) => {
                    decryptedFileCount += 1;
                    const task = decodeAndGenerateFile(fullPath, fullRootDirectory, hashedPassword, outputDirectory).then(
                        (result) => {
                            if (result?.overwroteSource) {
                                decryptedOverwroteInputs = true;
                            }
                        }
                    );
                    decryptTasks.push(task);
                },
                path,
                namedArgs.directory
            );
        });

        await Promise.all(decryptTasks);

        if (!namedArgs.quiet) {
            const resolvedOutputDir = pathModule.resolve(process.cwd(), outputDirectory);
            const finalOutputDir = fs.realpathSync(resolvedOutputDir);
            const fileLabel = decryptedFileCount === 1 ? "file" : "files";
            const destinationLabel = decryptedOverwroteInputs
                ? `in-place (overwriting originals) at ${finalOutputDir}`
                : `to ${finalOutputDir}`;
            console.log(`Decrypted ${decryptedFileCount} ${fileLabel} ${destinationLabel}`);
        }

        return;
    }

    await validatePassword(password, namedArgs.short);

    // write salt to config file
    if (config.salt !== salt) {
        config.salt = salt;
        writeConfig(configPath, config);
    }

    const isRememberEnabled = namedArgs.remember !== "false";

    const templateSubtitle = namedArgs.templateSubtitle ?? "";
    let templateSubtitleLink = namedArgs.templateSubtitleLink ?? "";
    const templateFooter = namedArgs.templateFooter ?? "";
    let templateFooterLink = namedArgs.templateFooterLink ?? "";
    const templatePageTitle = namedArgs.templatePageTitle || namedArgs.templateTitle;
    const rawTemplateImage = typeof namedArgs.templateImage === "string" ? namedArgs.templateImage.trim() : "";
    const templateImage = resolveTemplateImageSource(rawTemplateImage);
    const rawTemplateImageHeight =
        typeof namedArgs.templateImageHeight === "string" ? namedArgs.templateImageHeight.trim() : "";
    const rawTemplateImageWidth =
        typeof namedArgs.templateImageWidth === "string" ? namedArgs.templateImageWidth.trim() : "";
    const rawTemplateImageFocus =
        typeof namedArgs.templateImageFocus === "string" ? namedArgs.templateImageFocus.trim() : "";
    const templateImageIsPresent = templateImage.length > 0;
    const rawTemplateImagePosition =
        typeof namedArgs.templateImagePosition === "string" ? namedArgs.templateImagePosition.trim() : "";
    const validImagePositions = ["top", "left"];
    let templateImagePosition = rawTemplateImagePosition.toLowerCase() || "top";
    if (!validImagePositions.includes(templateImagePosition)) {
        if (rawTemplateImagePosition) {
            console.log(
                "WARNING: '--template-image-position' must be either 'top' or 'left'; falling back to 'top'."
            );
        }
        templateImagePosition = "top";
    }

    const defaultImageDimensions =
        templateImagePosition === "left"
            ? { height: "100%", width: "120px" }
            : { height: "60px", width: "100%" };
    const templateImageHeight = rawTemplateImageHeight || defaultImageDimensions.height;
    const templateImageWidth = rawTemplateImageWidth || defaultImageDimensions.width;
    const templateImageFocus = rawTemplateImageFocus || "center";

    const hasSubtitleText = typeof templateSubtitle === "string" && templateSubtitle.trim().length > 0;
    if (templateSubtitleLink && !hasSubtitleText) {
        console.log(
            "WARNING: '--template-subtitle-link' was provided without '--template-subtitle'; the link will be ignored."
        );
        templateSubtitleLink = "";
    }

    const hasFooterText = typeof templateFooter === "string" && templateFooter.trim().length > 0;
    if (templateFooterLink && !hasFooterText) {
        console.log(
            "WARNING: '--template-footer-link' was provided without '--template-footer'; the link will be ignored."
        );
        templateFooterLink = "";
    }

    const baseTemplateData = {
        is_remember_enabled: JSON.stringify(isRememberEnabled),
        js_staticrypt: buildStaticryptJS(),
        template_button: namedArgs.templateButton,
        template_color_primary: namedArgs.templateColorPrimary,
        template_color_secondary: namedArgs.templateColorSecondary,
        template_error: namedArgs.templateError,
        template_instructions: namedArgs.templateInstructions,
        template_placeholder: namedArgs.templatePlaceholder,
        template_remember: namedArgs.templateRemember,
        template_page_title: templatePageTitle,
        template_subtitle: templateSubtitle,
        template_subtitle_link: templateSubtitleLink,
        template_footer: templateFooter,
        template_footer_link: templateFooterLink,
        template_title: namedArgs.templateTitle,
        template_toggle_show: namedArgs.templateToggleShow,
        template_toggle_hide: namedArgs.templateToggleHide,
        template_image: templateImage,
        template_image_position: templateImagePosition,
        template_image_height: templateImageHeight,
        template_image_width: templateImageWidth,
        template_image_cover_position: templateImageFocus,
        template_image_is_present: templateImageIsPresent,
    };

    // encode all the files
    const encryptionTasks = [];
    let encryptedFileCount = 0;
    let overwroteInputs = false;

    positionalArguments.forEach((path) => {
        recursivelyApplyCallbackToHtmlFiles(
            (fullPath, fullRootDirectory) => {
                encryptedFileCount += 1;
                const task = encodeAndGenerateFile(
                    fullPath,
                    fullRootDirectory,
                    hashedPassword,
                    salt,
                    baseTemplateData,
                    isRememberEnabled,
                    namedArgs
                ).then((result) => {
                    if (result?.overwroteSource) {
                        overwroteInputs = true;
                    }
                });
                encryptionTasks.push(task);
            },
            path,
            namedArgs.directory
        );
    });

    await Promise.all(encryptionTasks);

    if (!namedArgs.quiet) {
        const exportDirectory = pathModule.resolve(process.cwd(), namedArgs.directory);
        const fileLabel = encryptedFileCount === 1 ? "file" : "files";
        const destinationLabel = overwroteInputs
            ? `in-place (overwriting originals) at ${exportDirectory}`
            : `to ${exportDirectory}`;
        console.log(`Encrypted ${encryptedFileCount} ${fileLabel} ${destinationLabel}`);
    }
}

async function decodeAndGenerateFile(path, fullRootDirectory, hashedPassword, outputDirectory) {
    // get the file content
    const encryptedFileContent = getFileContent(path);

    // extract the cipher text from the encrypted file
    const cipherTextMatch = encryptedFileContent.match(/"staticryptEncryptedMsgUniqueVariableName":\s*"([^"]+)"/);
    const saltMatch = encryptedFileContent.match(/"staticryptSaltUniqueVariableName":\s*"([^"]+)"/);

    if (!cipherTextMatch || !saltMatch) {
        return console.log(`ERROR: could not extract cipher text or salt from ${path}`);
    }

    // decrypt input
    const { success, decoded } = await decode(cipherTextMatch[1], hashedPassword, saltMatch[1]);

    if (!success) {
        return console.log(`ERROR: could not decrypt ${path}`);
    }

    const outputFilepath = getFullOutputPath(path, fullRootDirectory, outputDirectory);

    writeFile(outputFilepath, decoded);

    const resolvedOutputFilepath = fs.realpathSync(outputFilepath);
    const resolvedSourcePath = fs.realpathSync(path);
    return { overwroteSource: resolvedOutputFilepath === resolvedSourcePath };
}

async function encodeAndGenerateFile(
    path,
    rootDirectoryFromArguments,
    hashedPassword,
    salt,
    baseTemplateData,
    isRememberEnabled,
    namedArgs
) {
    // get the file content
    const contents = getFileContent(path);

    // encrypt input
    const encryptedMsg = await encodeWithHashedPassword(contents, hashedPassword);

    let rememberDurationInDays = parseInt(namedArgs.remember);
    rememberDurationInDays = isNaN(rememberDurationInDays) ? 0 : rememberDurationInDays;

    const staticryptConfig = {
        staticryptEncryptedMsgUniqueVariableName: encryptedMsg,
        isRememberEnabled,
        rememberDurationInDays,
        staticryptSaltUniqueVariableName: salt,
    };
    const templateData = {
        ...baseTemplateData,
        staticrypt_config: staticryptConfig,
    };

    // remove the base path so that the actual output path is relative to the base path
    const relativePath = pathModule.relative(rootDirectoryFromArguments, path);
    const outputFilepath = namedArgs.directory + "/" + relativePath;

    genFile(templateData, outputFilepath, namedArgs.template);

    const resolvedOutputFilepath = fs.realpathSync(pathModule.resolve(process.cwd(), outputFilepath));
    const resolvedSourcePath = fs.realpathSync(path);
    return { overwroteSource: resolvedOutputFilepath === resolvedSourcePath };
}

runStatiCrypt();

function resolveTemplateImageSource(imageInput) {
    if (!imageInput) {
        return "";
    }

    const normalizedInput = imageInput.trim();
    if (!normalizedInput) {
        return "";
    }

    const isDataUri = normalizedInput.startsWith("data:");
    const isHttpUrl = /^https?:\/\//i.test(normalizedInput);
    const isProtocolRelative = normalizedInput.startsWith("//");

    if (isDataUri || isHttpUrl || isProtocolRelative) {
        return normalizedInput;
    }

    try {
        const resolvedPath = pathModule.resolve(process.cwd(), normalizedInput);
        if (!fs.existsSync(resolvedPath)) {
            return normalizedInput;
        }

        const stats = fs.statSync(resolvedPath);
        if (!stats.isFile()) {
            return normalizedInput;
        }

        const fileBuffer = fs.readFileSync(resolvedPath);
        const encodedFile = fileBuffer.toString("base64");
        const extension = pathModule.extname(resolvedPath).toLowerCase();
        const mimeType = TEMPLATE_IMAGE_MIME_TYPES[extension] || "application/octet-stream";
        return `data:${mimeType};base64,${encodedFile}`;
    } catch (error) {
        console.log(`WARNING: Failed to inline template image at "${imageInput}": ${error.message}`);
        return normalizedInput;
    }
}
