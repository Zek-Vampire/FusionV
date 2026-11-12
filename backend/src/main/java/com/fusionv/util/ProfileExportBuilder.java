package com.fusionv.util;

import java.util.List;

/**
 * Builds a printable text profile.
 * Module 5: StringBuilder is used because we append many pieces to one text. Plain "+" in a loop would
 * create a new String object every time. StringBuilder is fast because it is NOT synchronized, and this
 * method runs inside a single request thread, so no locking is needed.
 */
public class ProfileExportBuilder {

    private final StringBuilder text = new StringBuilder();

    public ProfileExportBuilder addTitle(String title) {
        text.append(title).append('\n');
        text.append("=".repeat(title.length())).append('\n');
        return this;
    }

    public ProfileExportBuilder addLine(String label, String value) {
        String shown = (value == null || value.isBlank()) ? "-" : value;
        text.append(String.format("%-12s: %s%n", label, shown));
        return this;
    }

    public ProfileExportBuilder addList(String label, List<String> items) {
        text.append(label).append(" (").append(items.size()).append("):\n");
        for (int i = 0; i < items.size(); i++) {
            text.append("  ").append(i + 1).append(". ").append(items.get(i)).append('\n');
        }
        return this;
    }

    public String build() {
        return text.toString();
    }
}
