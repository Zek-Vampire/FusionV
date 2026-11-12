package com.fusionv.util;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Small validation helpers.
 * Module 5: regular expressions (Pattern/Matcher) and String methods.
 * Module 1: loops, conditionals, operators and methods.
 */
public final class ValidationUtil {

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    private static final Pattern SKILL_PATTERN = Pattern.compile("^[A-Za-z0-9+#./ -]{1,50}$");
    private static final Pattern URL_PATTERN = Pattern.compile("^https?://\\S+$");

    private ValidationUtil() {
    }

    /** True when the text looks like name@domain.tld */
    public static boolean isValidEmail(String email) {
        return email != null && EMAIL_PATTERN.matcher(email.trim()).matches();
    }

    /** Skill/interest names: letters, digits and + # . / - space, max 50 characters. */
    public static boolean isValidSkillName(String name) {
        return name != null && SKILL_PATTERN.matcher(name.trim()).matches();
    }

    /** Only http:// or https:// links are accepted (blocks javascript: links). */
    public static boolean isValidUrl(String url) {
        return url != null && URL_PATTERN.matcher(url.trim()).matches();
    }

    /**
     * Password rule: at least 8 characters, containing at least one letter and one digit.
     * We walk through the characters with a loop (Module 1).
     */
    public static boolean isStrongPassword(String password) {
        if (password == null || password.length() < AppConstants.MIN_PASSWORD_LENGTH) {
            return false;
        }
        boolean hasLetter = false;
        boolean hasDigit = false;
        for (int i = 0; i < password.length(); i++) {
            char c = password.charAt(i);
            if (Character.isLetter(c)) {
                hasLetter = true;
            } else if (Character.isDigit(c)) {
                hasDigit = true;
            }
        }
        return hasLetter && hasDigit;
    }

    /** Trims, removes blanks and duplicates (ignoring case) and keeps the original order. */
    public static List<String> cleanNames(List<String> rawNames) {
        Set<String> seenLowerCase = new LinkedHashSet<>();
        List<String> result = new ArrayList<>();
        if (rawNames == null) {
            return result;
        }
        for (String raw : rawNames) {
            if (raw == null || raw.isBlank()) {
                continue;
            }
            String trimmed = raw.trim();
            if (seenLowerCase.add(trimmed.toLowerCase())) {
                result.add(trimmed);
            }
        }
        return result;
    }

    /** "Java, spring ,JAVA" becomes "java,spring" (lower case, no duplicates). */
    public static String normalizeTags(String tags) {
        if (tags == null || tags.isBlank()) {
            return "";
        }
        Set<String> unique = new LinkedHashSet<>();
        for (String part : tags.split(",")) {
            String tag = part.trim().toLowerCase();
            if (!tag.isEmpty()) {
                unique.add(tag);
            }
        }
        return String.join(",", unique);
    }
}
