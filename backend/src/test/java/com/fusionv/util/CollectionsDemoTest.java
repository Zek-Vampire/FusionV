package com.fusionv.util;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Vector;

import static org.junit.jupiter.api.Assertions.assertEquals;

class CollectionsDemoTest {

    @Test
    void arrayCountsFirstLetters() {
        int[] counts = CollectionsDemo.countSkillsByFirstLetter(new String[]{"Java", "JavaScript", "Python"});
        assertEquals(2, counts['J' - 'A']);
        assertEquals(1, counts['P' - 'A']);
    }

    @Test
    void setRemovesDuplicates() {
        assertEquals(Set.of("java", "python"), CollectionsDemo.uniqueSkills(List.of("Java", " java", "Python")));
    }

    @Test
    void mapCountsPopularity() {
        Map<String, Integer> result = CollectionsDemo.skillPopularity(List.of(List.of("Java", "SQL"), List.of("java")));
        assertEquals(2, result.get("java"));
        assertEquals(1, result.get("sql"));
    }

    @Test
    void listSearchIgnoresCase() {
        assertEquals(List.of("Aryan", "Sara"), CollectionsDemo.searchMembers(List.of("Aryan", "Priya", "Sara"), "AR"));
    }

    @Test
    void vectorSurvivesTwoWritingThreads() throws InterruptedException {
        Vector<String> list = CollectionsDemo.fillWaitingListWithTwoThreads();
        assertEquals(100, list.size());
    }
}
