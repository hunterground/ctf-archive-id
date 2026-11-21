package com.flab.jajajaja;

public class KeyValidator {

    public static boolean validate(String key) {
        if (key == null || key.length() != 35) {
            return false;
        }

        String[] segments = key.split("-");
        if (segments.length != 4) {
            return false;
        }

        try {
            long s1 = Long.parseLong(segments[0], 16);
            long s2 = Long.parseLong(segments[1], 16);
            long s3 = Long.parseLong(segments[2], 16);
            long s4 = Long.parseLong(segments[3], 16);

            if ((s1 ^ s2) != 0x3B13CB9FL) {
                return false;
            }

            if (((s2 + s3) & 0xFFFFFFFFL) != 0xD37B732DL) {
                return false;
            }

            if (((s1 * 0x1337L) & 0xFFFFFFFFL) != 0xAB26AF37L) {
                return false;
            }

            if ((s3 & s4) != 0x30C20DL) {
                return false;
            }

            if ((s3 ^ s4) != 0xABCB21F2L) {
                return false;
            }

            long rotated = ((s2 << 13) | (s2 >>> 19)) & 0xFFFFFFFFL;
            if ((rotated ^ 0xDEADBEEFL) != 0x2F5E7487L) {
                return false;
            }

            if (((s1 + s2 + s3 + s4) & 0xFFFFL) != 0x79ABL) {
                return false;
            }

            if (Long.bitCount(s1 ^ s4) != 15) {
                return false;
            }

            long highSum = (s1 >>> 16) + (s2 >>> 16) + (s3 >>> 16) + (s4 >>> 16);
            if ((highSum & 0xFFFFL) != 0x67C6L) {
                return false;
            }

            return true;

        } catch (NumberFormatException e) {
            return false;
        }
    }
}