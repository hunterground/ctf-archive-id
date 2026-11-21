package com.flab.jajajaja;

import javax.crypto.Cipher;
import javax.crypto.spec.ChaCha20ParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;

public class ChaCha20 {

    private static final String ENV_KEY_NAME = "MAKEY";

    /**
     * Decrypts the given Base64 encoded ciphertext using the key from the environment variable.
     *
     * @param ciphertextBase64 Base64 encoded ciphertext
     * @param nonceBase64 Base64 encoded nonce (12 bytes)
     * @param counter The initial counter value (usually 1)
     * @return The decrypted string
     * @throws Exception If decryption fails or key is missing
     */
    public static String decrypt(String ciphertextBase64, String nonceBase64, int counter) throws Exception {
        String keyStr = System.getenv(ENV_KEY_NAME);
        if (keyStr == null || keyStr.isEmpty()) {
            throw new RuntimeException("Environment variable " + ENV_KEY_NAME + " is not set.");
        }

        byte[] keyBytes = Base64.getDecoder().decode(keyStr);
        byte[] nonceBytes = Base64.getDecoder().decode(nonceBase64);
        byte[] ciphertextBytes = Base64.getDecoder().decode(ciphertextBase64);

        Cipher cipher = Cipher.getInstance("ChaCha20");
        ChaCha20ParameterSpec paramSpec = new ChaCha20ParameterSpec(nonceBytes, counter);
        SecretKeySpec keySpec = new SecretKeySpec(keyBytes, "ChaCha20");

        cipher.init(Cipher.DECRYPT_MODE, keySpec, paramSpec);
        byte[] decryptedBytes = cipher.doFinal(ciphertextBytes);

        return new String(decryptedBytes);
    }
}
