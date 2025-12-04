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

        positionalArguments.forEach((path) => {
            recursivelyApplyCallbackToHtmlFiles(
                (fullPath, fullRootDirectory) => {
                    decodeAndGenerateFile(fullPath, fullRootDirectory, hashedPassword, outputDirectory);
                },
                path,
                namedArgs.directory
            );
        });

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
    const templatePageTitle = namedArgs.templatePageTitle || namedArgs.templateTitle;

    const hasSubtitleText = typeof templateSubtitle === "string" && templateSubtitle.trim().length > 0;
    if (templateSubtitleLink && !hasSubtitleText) {
        console.log(
            "WARNING: '--template-subtitle-link' was provided without '--template-subtitle'; the link will be ignored."
        );
        templateSubtitleLink = "";
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
        template_title: namedArgs.templateTitle,
        template_toggle_show: namedArgs.templateToggleShow,
        template_toggle_hide: namedArgs.templateToggleHide,
    };

    // encode all the files
    const encryptionTasks = [];
    let encryptedFileCount = 0;

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
                );
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
        console.log(`Encrypted ${encryptedFileCount} ${fileLabel} to ${exportDirectory}`);
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
}

runStatiCrypt();
