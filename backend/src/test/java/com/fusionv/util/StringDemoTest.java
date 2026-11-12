package com.fusionv.util;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class StringDemoTest {

    @Test
    void formatsNames() {
        assertEquals("Aryan Sharma", StringDemo.formatName("  aRYAN   sharma "));
    }

    @Test
    void comparesStrings() {
        assertEquals("exactly equal", StringDemo.compareSkills("Java", "Java"));
        assertEquals("equal ignoring case", StringDemo.compareSkills("Java", "java"));
        assertTrue(StringDemo.compareSkills("Java", "Python").contains("before"));
    }

    @Test
    void searchesText() {
        assertTrue(StringDemo.searchReport("Spring Boot", "boot").contains("firstPosition=7"));
    }

    @Test
    void findsHashtagsWithRegex() {
        assertEquals(List.of("hackathon", "FusionV"), StringDemo.findHashtags("Won #hackathon with #FusionV"));
    }

    @Test
    void stringBufferKeepsEveryCharacterFromTwoThreads() throws InterruptedException {
        assertEquals(200, StringDemo.sharedLogWithTwoThreads());
    }
}
