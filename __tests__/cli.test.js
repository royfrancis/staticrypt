const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const REPO_ROOT = path.join(__dirname, "..");
const CLI_PATH = path.join(REPO_ROOT, "cli", "index.js");
const TEST_PASSWORD = "thisIsAVeryLongTestPassword!";
const TEST_SALT = "b93bbaf35459951c47721d1f3eaeb5b9";
const SAMPLE_HTML = "<!doctype html><html><body><h1>Secret</h1></body></html>";

const tempDirs = [];

afterEach(() => {
    while (tempDirs.length) {
        const dir = tempDirs.pop();
        fs.rmSync(dir, { recursive: true, force: true });
    }
});

function makeTempDir() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "staticrypt-test-"));
    tempDirs.push(dir);
    return dir;
}

function writeSampleHtml(directory, relativePath = "sample.html", contents = SAMPLE_HTML) {
    const filePath = path.join(directory, relativePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, contents, "utf8");
    return filePath;
}

function runStaticrypt(args, options = {}) {
    const env = {
        ...process.env,
        STATICRYPT_PASSWORD: TEST_PASSWORD,
        FORCE_COLOR: "0",
        ...options.env,
    };

    const result = spawnSync("node", [CLI_PATH, ...args], {
        cwd: options.cwd || REPO_ROOT,
        env,
        encoding: "utf8",
    });

    return {
        status: result.status,
        stdout: result.stdout,
        stderr: result.stderr,
    };
}

function getExpectedOutputPath(rootArgumentPath, filePath, outputDir) {
    const baseDir = path.dirname(path.resolve(rootArgumentPath));
    const relativePath = path.relative(baseDir, path.resolve(filePath));
    return path.join(outputDir, relativePath);
}

describe("cli arguments", () => {
    test("share link outputs hashed password and optional remember flag", () => {
        const baseArgs = ["--share", "https://example.test/secret", "--salt", TEST_SALT, "--config", "false"];
        const shareResult = runStaticrypt(baseArgs);
        expect(shareResult.status).toBe(0);
        expect(shareResult.stdout.trim()).toMatch(
            /^https:\/\/example\.test\/secret#staticrypt_pwd=[0-9a-f]+$/
        );

        const rememberShareResult = runStaticrypt([...baseArgs, "--share-remember"]);
        expect(rememberShareResult.status).toBe(0);
        expect(rememberShareResult.stdout.trim()).toContain("&remember_me");
    });

    test("remember false disables remember-me state in generated page", () => {
        const workspace = makeTempDir();
        const inputFile = writeSampleHtml(workspace);
        const outputDir = path.join(workspace, "encrypted-output");

        const result = runStaticrypt([
            inputFile,
            "--directory",
            outputDir,
            "--config",
            "false",
            "--salt",
            TEST_SALT,
            "--remember",
            "false",
        ], { cwd: workspace });

        expect(result.status).toBe(0);
        const encryptedFilePath = path.join(outputDir, "sample.html");
        const encryptedContents = fs.readFileSync(encryptedFilePath, "utf8");
        expect(encryptedContents).toContain('"isRememberEnabled":false');
    });

    test("remember duration and template label are reflected in output", () => {
        const workspace = makeTempDir();
        const inputFile = writeSampleHtml(workspace);
        const outputDir = path.join(workspace, "remember-days");

        const result = runStaticrypt([
            inputFile,
            "--directory",
            outputDir,
            "--config",
            "false",
            "--salt",
            TEST_SALT,
            "--remember",
            "7",
            "--template-remember",
            "Remember forever",
        ], { cwd: workspace });

        expect(result.status).toBe(0);
        const encryptedFilePath = path.join(outputDir, "sample.html");
        const encryptedContents = fs.readFileSync(encryptedFilePath, "utf8");
        expect(encryptedContents).toContain('"rememberDurationInDays":7');
        expect(encryptedContents).toContain("Remember forever");
    });

    test("recursive encryption processes nested directories and copies other files", () => {
        const workspace = makeTempDir();
        const inputRoot = path.join(workspace, "input");
        fs.mkdirSync(inputRoot, { recursive: true });
        writeSampleHtml(inputRoot, "index.html", "<html>Root</html>");
        const nestedDir = path.join(inputRoot, "nested");
        fs.mkdirSync(nestedDir, { recursive: true });
        writeSampleHtml(nestedDir, "page.htm", "<html>Nested</html>");
        const assetPath = path.join(inputRoot, "notes.txt");
        fs.writeFileSync(assetPath, "plain asset", "utf8");

        const outputDir = path.join(workspace, "recursive-out");
        const result = runStaticrypt([
            inputRoot,
            "--recursive",
            "--directory",
            outputDir,
            "--config",
            "false",
            "--salt",
            TEST_SALT,
        ], { cwd: workspace });

        expect(result.status).toBe(0);

        const encryptedRoot = getExpectedOutputPath(inputRoot, path.join(inputRoot, "index.html"), outputDir);
        const encryptedNested = getExpectedOutputPath(inputRoot, path.join(nestedDir, "page.htm"), outputDir);
        const copiedAsset = getExpectedOutputPath(inputRoot, assetPath, outputDir);

        expect(fs.readFileSync(encryptedRoot, "utf8")).toContain("staticryptConfig");
        expect(fs.readFileSync(encryptedNested, "utf8")).toContain("staticryptConfig");
        expect(fs.readFileSync(copiedAsset, "utf8")).toBe("plain asset");
    });

    test("decrypt flag restores the original HTML", () => {
        const workspace = makeTempDir();
        const originalHtml = "<html><body>Restore me</body></html>";
        const inputFile = writeSampleHtml(workspace, "source.html", originalHtml);
        const encryptedDir = path.join(workspace, "enc");
        const decryptedDir = path.join(workspace, "dec");

        const encryptResult = runStaticrypt([
            inputFile,
            "--directory",
            encryptedDir,
            "--config",
            "false",
            "--salt",
            TEST_SALT,
        ], { cwd: workspace });
        expect(encryptResult.status).toBe(0);
        const encryptedFilePath = path.join(encryptedDir, "source.html");

        const decryptResult = runStaticrypt([
            encryptedFilePath,
            "--decrypt",
            "--directory",
            decryptedDir,
            "--config",
            "false",
            "--salt",
            TEST_SALT,
        ], { cwd: workspace });

        expect(decryptResult.status).toBe(0);
        const decryptedFilePath = path.join(decryptedDir, "source.html");
        expect(fs.readFileSync(decryptedFilePath, "utf8")).toBe(originalHtml);
    });

    test("missing input path surfaces a helpful error", () => {
        const result = runStaticrypt(["missing.html", "--config", "false", "--salt", TEST_SALT]);
        expect(result.status).not.toBe(0);
        expect(result.stdout).toContain('Input path "missing.html" does not exist.');
    });
});
