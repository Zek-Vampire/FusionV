package com.fusionv.util;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;

class ProfileExportBuilderTest {

    @Test
    void buildsReadableText() {
        String text = new ProfileExportBuilder()
                .addTitle("FusionV profile: Aryan")
                .addLine("Email", "a@b.com")
                .addLine("About", null)
                .addList("Skills", List.of("Java", "SQL"))
                .build();
        assertTrue(text.contains("FusionV profile: Aryan"));
        assertTrue(text.contains("a@b.com"));
        assertTrue(text.contains("About       : -"));
        assertTrue(text.contains("Skills (2):"));
        assertTrue(text.contains("2. SQL"));
    }
}
