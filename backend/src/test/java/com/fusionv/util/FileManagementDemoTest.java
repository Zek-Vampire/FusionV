package com.fusionv.util;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class FileManagementDemoTest {

    @TempDir
    Path folder;

    @Test
    void serializationKeepsFieldsButNotTransientOnes() throws Exception {
        Path file = folder.resolve("card.bin");
        FileManagementDemo.saveCard(new FileManagementDemo.StudentCard("Aryan", 2, "secret note"), file);
        FileManagementDemo.StudentCard loaded = FileManagementDemo.loadCard(file);
        assertEquals("Aryan", loaded.getName());
        assertEquals(2, loaded.getYear());
        assertNull(loaded.getTemporaryNote());
    }

    @Test
    void randomAccessFileReadsSecondRecordDirectly() throws IOException {
        String result = FileManagementDemo.readSecondRecord(folder.resolve("r.dat"), new String[]{"Aryan", "Priya"}, new int[]{2, 3});
        assertEquals("Priya / year 3", result);
    }

    @Test
    void countBytesUsesFinallyAndReturnsMinusOneForMissingFile() throws IOException {
        Path file = folder.resolve("a.txt");
        Files.writeString(file, "12345");
        assertEquals(5, FileManagementDemo.countBytes(file));
        assertEquals(-1, FileManagementDemo.countBytes(folder.resolve("missing.txt")));
    }

    @Test
    void nioCreateRenameReadDelete() throws IOException {
        assertEquals("FusionV notes", FileManagementDemo.nioLifecycle(folder));
    }
}
