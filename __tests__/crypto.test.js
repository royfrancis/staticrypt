const cryptoEngine = require("../lib/cryptoEngine.js");
const codec = require("../lib/codec.js").init(cryptoEngine);

const TEST_PASSWORD = "thisIsAVeryLongTestPassword!";
const TEST_SALT = "b93bbaf35459951c47721d1f3eaeb5b9";
const TEST_MESSAGE = "<!doctype html><html><body><h1>Secret</h1></body></html>";

describe("cryptoEngine.hashPassword", () => {
    it("is deterministic for the same password and salt", async () => {
        const first = await cryptoEngine.hashPassword(TEST_PASSWORD, TEST_SALT);
        const second = await cryptoEngine.hashPassword(TEST_PASSWORD, TEST_SALT);

        expect(first).toBe(second);
    });

    it("produces a different hash for a different password", async () => {
        const hashedA = await cryptoEngine.hashPassword(TEST_PASSWORD, TEST_SALT);
        const hashedB = await cryptoEngine.hashPassword("someOtherPassword!", TEST_SALT);

        expect(hashedA).not.toBe(hashedB);
    });

    it("produces a different hash for a different salt", async () => {
        const hashedA = await cryptoEngine.hashPassword(TEST_PASSWORD, TEST_SALT);
        const hashedB = await cryptoEngine.hashPassword(TEST_PASSWORD, "a".repeat(32));

        expect(hashedA).not.toBe(hashedB);
    });
});

describe("cryptoEngine.encrypt / decrypt", () => {
    it("round-trips a message", async () => {
        const hashedPassword = await cryptoEngine.hashPassword(TEST_PASSWORD, TEST_SALT);
        const encrypted = await cryptoEngine.encrypt(TEST_MESSAGE, hashedPassword);
        const decrypted = await cryptoEngine.decrypt(encrypted, hashedPassword);

        expect(decrypted).toBe(TEST_MESSAGE);
    });

    it("uses a fresh random IV on every call, so repeated encryptions of the same message differ", async () => {
        const hashedPassword = await cryptoEngine.hashPassword(TEST_PASSWORD, TEST_SALT);
        const encryptedA = await cryptoEngine.encrypt(TEST_MESSAGE, hashedPassword);
        const encryptedB = await cryptoEngine.encrypt(TEST_MESSAGE, hashedPassword);

        expect(encryptedA).not.toBe(encryptedB);
        // both should still decrypt correctly despite differing ciphertext
        expect(await cryptoEngine.decrypt(encryptedA, hashedPassword)).toBe(TEST_MESSAGE);
        expect(await cryptoEngine.decrypt(encryptedB, hashedPassword)).toBe(TEST_MESSAGE);
    });
});

describe("codec.encode / decode", () => {
    it("round-trips a message and reports success", async () => {
        const encoded = await codec.encode(TEST_MESSAGE, TEST_PASSWORD, TEST_SALT);
        const hashedPassword = await cryptoEngine.hashPassword(TEST_PASSWORD, TEST_SALT);

        const result = await codec.decode(encoded, hashedPassword, TEST_SALT);

        expect(result.success).toBe(true);
        expect(result.decoded).toBe(TEST_MESSAGE);
    });

    it("fails with the wrong password", async () => {
        const encoded = await codec.encode(TEST_MESSAGE, TEST_PASSWORD, TEST_SALT);
        const wrongHashedPassword = await cryptoEngine.hashPassword("definitelyWrongPassword!", TEST_SALT);

        const result = await codec.decode(encoded, wrongHashedPassword, TEST_SALT);

        expect(result.success).toBe(false);
        expect(result.message).toBe("Signature mismatch");
    });

    it("detects tampering with the ciphertext", async () => {
        const encoded = await codec.encode(TEST_MESSAGE, TEST_PASSWORD, TEST_SALT);
        const hashedPassword = await cryptoEngine.hashPassword(TEST_PASSWORD, TEST_SALT);

        // flip one hex character well past the 64-char HMAC prefix, inside the ciphertext body
        const tamperIndex = 70;
        const originalChar = encoded[tamperIndex];
        const replacementChar = originalChar === "0" ? "1" : "0";
        const tampered =
            encoded.substring(0, tamperIndex) + replacementChar + encoded.substring(tamperIndex + 1);

        const result = await codec.decode(tampered, hashedPassword, TEST_SALT);

        expect(result.success).toBe(false);
        expect(result.message).toBe("Signature mismatch");
    });

    it("detects tampering with the HMAC itself", async () => {
        const encoded = await codec.encode(TEST_MESSAGE, TEST_PASSWORD, TEST_SALT);
        const hashedPassword = await cryptoEngine.hashPassword(TEST_PASSWORD, TEST_SALT);

        const originalChar = encoded[0];
        const replacementChar = originalChar === "0" ? "1" : "0";
        const tampered = replacementChar + encoded.substring(1);

        const result = await codec.decode(tampered, hashedPassword, TEST_SALT);

        expect(result.success).toBe(false);
        expect(result.message).toBe("Signature mismatch");
    });

    it("falls back to a legacy 2-round hash (pre-third-round remember-me links)", async () => {
        const encoded = await codec.encode(TEST_MESSAGE, TEST_PASSWORD, TEST_SALT);

        // simulate a client that only has a 2-round hash cached (legacy + second round, no third round)
        const legacyHashedPassword = await cryptoEngine.hashLegacyRound(TEST_PASSWORD, TEST_SALT);
        const twoRoundHashedPassword = await cryptoEngine.hashSecondRound(legacyHashedPassword, TEST_SALT);

        const result = await codec.decode(encoded, twoRoundHashedPassword, TEST_SALT);

        expect(result.success).toBe(true);
        expect(result.decoded).toBe(TEST_MESSAGE);
    });

    it("falls back to a legacy 1-round hash (original remember-me links)", async () => {
        const encoded = await codec.encode(TEST_MESSAGE, TEST_PASSWORD, TEST_SALT);

        // simulate a client that only has the original 1-round (legacy) hash cached
        const legacyHashedPassword = await cryptoEngine.hashLegacyRound(TEST_PASSWORD, TEST_SALT);

        const result = await codec.decode(encoded, legacyHashedPassword, TEST_SALT);

        expect(result.success).toBe(true);
        expect(result.decoded).toBe(TEST_MESSAGE);
    });
});
