package com.fusionv.util;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Vector;

/**
 * Module 4 demonstration (run main() to see the output).
 * Every method uses the collection for a FusionV-style job: skills, teams, search results.
 */
public class CollectionsDemo {

    /** ARRAY: fixed size. Counts how many skills start with each letter A..Z. */
    public static int[] countSkillsByFirstLetter(String[] skills) {
        int[] counts = new int[26];
        for (String skill : skills) {
            if (skill == null || skill.isEmpty()) {
                continue;
            }
            char first = Character.toUpperCase(skill.charAt(0));
            if (first >= 'A' && first <= 'Z') {
                counts[first - 'A']++;
            }
        }
        return counts;
    }

    /** SET: removes duplicates automatically. Two students listing "Java" give one "Java". */
    public static Set<String> uniqueSkills(List<String> allSkills) {
        Set<String> unique = new HashSet<>();
        for (String skill : allSkills) {
            unique.add(skill.trim().toLowerCase());
        }
        return unique;
    }

    /** MAP (HashMap): skill name to the number of students who have it. */
    public static Map<String, Integer> skillPopularity(List<List<String>> skillsOfEachStudent) {
        Map<String, Integer> popularity = new HashMap<>();
        for (List<String> studentSkills : skillsOfEachStudent) {
            for (String skill : studentSkills) {
                String key = skill.trim().toLowerCase();
                popularity.put(key, popularity.getOrDefault(key, 0) + 1);
            }
        }
        return popularity;
    }

    /** LIST / ArrayList: returns the team members whose name contains the search text. */
    public static List<String> searchMembers(List<String> memberNames, String text) {
        List<String> found = new ArrayList<>();
        String lowerText = text.toLowerCase();
        for (String name : memberNames) {
            if (name.toLowerCase().contains(lowerText)) {
                found.add(name);
            }
        }
        return found;
    }

    /**
     * VECTOR: like ArrayList but every method is synchronized, so several threads can add to it safely.
     * Here a "waiting list" of students is filled by two threads at the same time.
     */
    public static Vector<String> fillWaitingListWithTwoThreads() throws InterruptedException {
        Vector<String> waitingList = new Vector<>();
        Runnable addStudents = () -> {
            for (int i = 1; i <= 50; i++) {
                waitingList.add(Thread.currentThread().getName() + "-student" + i);
            }
        };
        Thread first = new Thread(addStudents, "A");
        Thread second = new Thread(addStudents, "B");
        first.start();
        second.start();
        first.join();
        second.join();
        return waitingList;           // always exactly 100 elements
    }

    public static void main(String[] args) throws InterruptedException {
        String[] skills = {"Java", "Python", "JavaScript", "CSS"};
        System.out.println("Skills starting with J: " + countSkillsByFirstLetter(skills)['J' - 'A']);
        System.out.println("Unique skills: " + uniqueSkills(List.of("Java", "java ", "Python")));
        System.out.println("Popularity: " + skillPopularity(List.of(List.of("Java", "SQL"), List.of("java"))));
        System.out.println("Search 'ar': " + searchMembers(List.of("Aryan", "Priya", "Sara"), "ar"));
        System.out.println("Vector size: " + fillWaitingListWithTwoThreads().size());
    }
}
