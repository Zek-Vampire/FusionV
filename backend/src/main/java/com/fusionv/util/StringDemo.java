package com.fusionv.util;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Module 5 demonstration: creation, comparison, searching, StringBuilder, StringBuffer, regex. */
public class StringDemo {

    /** Creation and manipulation: "  aRYAN   sharma " becomes "Aryan Sharma". */
    public static String formatName(String rawName) {
        String[] words = rawName.trim().split("\\s+");
        StringBuilder result = new StringBuilder();
        for (String word : words) {
            if (word.isEmpty()) {
                continue;
            }
            if (result.length() > 0) {
                result.append(' ');
            }
            result.append(Character.toUpperCase(word.charAt(0))).append(word.substring(1).toLowerCase());
        }
        return result.toString();
    }

    /** Comparison: equals vs equalsIgnoreCase vs compareTo (alphabetical order). */
    public static String compareSkills(String a, String b) {
        if (a.equals(b)) {
            return "exactly equal";
        }
        if (a.equalsIgnoreCase(b)) {
            return "equal ignoring case";
        }
        return a.compareToIgnoreCase(b) < 0 ? a + " comes before " + b : a + " comes after " + b;
    }

    /** Searching: indexOf, contains, startsWith. Returns a short report. */
    public static String searchReport(String text, String word) {
        int position = text.toLowerCase().indexOf(word.toLowerCase());
        return "contains=" + text.toLowerCase().contains(word.toLowerCase())
                + ", firstPosition=" + position
                + ", startsWith=" + text.toLowerCase().startsWith(word.toLowerCase());
    }

    /** Regex: finds every #hashtag inside a post. */
    public static List<String> findHashtags(String postText) {
        List<String> tags = new ArrayList<>();
        Matcher matcher = Pattern.compile("#(\\w+)").matcher(postText);
        while (matcher.find()) {
            tags.add(matcher.group(1));
        }
        return tags;
    }

    /**
     * StringBuffer: same API as StringBuilder but every method is synchronized, so many threads can
     * append to the SAME object safely. Two threads write log lines into one shared buffer; nothing
     * is lost or mixed inside a single append.
     */
    public static int sharedLogWithTwoThreads() throws InterruptedException {
        StringBuffer sharedLog = new StringBuffer();
        Runnable writer = () -> {
            for (int i = 0; i < 100; i++) {
                sharedLog.append("x");
            }
        };
        Thread first = new Thread(writer);
        Thread second = new Thread(writer);
        first.start();
        second.start();
        first.join();
        second.join();
        return sharedLog.length();    // always 200 with StringBuffer
    }

    public static void main(String[] args) throws InterruptedException {
        System.out.println(formatName("  aRYAN   sharma "));
        System.out.println(compareSkills("Java", "java"));
        System.out.println(searchReport("Spring Boot backend", "boot"));
        System.out.println(findHashtags("Won #hackathon with #FusionV today"));
        System.out.println("StringBuffer length: " + sharedLogWithTwoThreads());
    }
}
