package com.fusionv.util;

import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ValidationUtilTest {

    @Test
    void acceptsNormalEmails() {
        assertTrue(ValidationUtil.isValidEmail("aryan.sharma@example.com"));
        assertTrue(ValidationUtil.isValidEmail("  student+test@college.edu.in "));
    }

    @Test
    void rejectsBadEmails() {
        assertFalse(ValidationUtil.isValidEmail("no-at-sign.com"));
        assertFalse(ValidationUtil.isValidEmail("a@b"));
        assertFalse(ValidationUtil.isValidEmail("two@@example.com"));
        assertFalse(ValidationUtil.isValidEmail(null));
    }

    @Test
    void passwordNeedsLengthLetterAndDigit() {
        assertTrue(ValidationUtil.isStrongPassword("hello1234"));
        assertFalse(ValidationUtil.isStrongPassword("short1"));
        assertFalse(ValidationUtil.isStrongPassword("onlyletters"));
        assertFalse(ValidationUtil.isStrongPassword("123456789"));
        assertFalse(ValidationUtil.isStrongPassword(null));
    }

    @Test
    void urlMustBeHttpOrHttps() {
        assertTrue(ValidationUtil.isValidUrl("https://linkedin.com/in/someone"));
        assertFalse(ValidationUtil.isValidUrl("javascript:alert(1)"));
        assertFalse(ValidationUtil.isValidUrl("ftp://example.com"));
    }

    @Test
    void skillNamesAllowTechCharacters() {
        assertTrue(ValidationUtil.isValidSkillName("C++"));
        assertTrue(ValidationUtil.isValidSkillName("UI/UX Design"));
        assertFalse(ValidationUtil.isValidSkillName("<script>"));
        assertFalse(ValidationUtil.isValidSkillName(""));
    }

    @Test
    void cleanNamesRemovesBlanksAndDuplicatesIgnoringCase() {
        List<String> cleaned = ValidationUtil.cleanNames(Arrays.asList(" Java ", "java", "", null, "Python"));
        assertEquals(List.of("Java", "Python"), cleaned);
    }

    @Test
    void normalizeTagsLowerCasesAndRemovesDuplicates() {
        assertEquals("java,spring", ValidationUtil.normalizeTags("Java, spring ,JAVA,"));
        assertEquals("", ValidationUtil.normalizeTags("   "));
    }
}
