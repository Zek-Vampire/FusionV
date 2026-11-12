package com.fusionv.service;

import com.fusionv.dto.FileDownload;
import com.fusionv.exception.FileStorageException;
import com.fusionv.exception.InvalidFileException;
import com.fusionv.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Uses a real temporary folder, so it tests the real file code (no mocks). */
class FileStorageServiceTest {

    @TempDir
    Path tempDir;
    FileStorageService storage;

    @BeforeEach
    void setUp() {
        storage = new FileStorageService(tempDir.toString(), 1024 * 1024);
    }

    private MockMultipartFile pdf(String name) {
        return new MockMultipartFile("file", name, "application/pdf", "%PDF-1.4 test".getBytes(StandardCharsets.UTF_8));
    }

    @Test
    void storesFileUnderRandomNameInsideResourcesFolder() throws Exception {
        String storedName = storage.storeResource(pdf("../../evil name.pdf"));
        assertTrue(storedName.endsWith(".pdf"));
        assertFalse(storedName.contains("evil"));
        assertTrue(Files.exists(tempDir.resolve("resources").resolve(storedName)));
    }

    @Test
    void leavesNoTemporaryPartFileBehind() throws Exception {
        storage.storeResource(pdf("a.pdf"));
        try (var files = Files.list(tempDir.resolve("resources"))) {
            assertEquals(0, files.filter(p -> p.toString().endsWith(".part")).count());
        }
    }

    @Test
    void rejectsExecutableFiles() {
        MockMultipartFile exe = new MockMultipartFile("file", "run.exe", "application/octet-stream", new byte[]{1, 2, 3});
        assertThrows(InvalidFileException.class, () -> storage.storeResource(exe));
    }

    @Test
    void rejectsFakePdf() {
        MockMultipartFile fake = new MockMultipartFile("file", "a.pdf", "application/pdf", "<html></html>".getBytes(StandardCharsets.UTF_8));
        assertThrows(InvalidFileException.class, () -> storage.storeResource(fake));
    }

    @Test
    void resumeAllowsPdfButNotPng() throws Exception {
        assertTrue(storage.storeResume(pdf("cv.pdf")).endsWith(".pdf"));
        MockMultipartFile png = new MockMultipartFile("file", "me.png", "image/png", new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0});
        assertThrows(InvalidFileException.class, () -> storage.storeResume(png));
    }

    @Test
    void loadsStoredFileForDownload() throws Exception {
        String storedName = storage.storeResource(pdf("a.pdf"));
        FileDownload download = storage.loadResource(storedName, "Notes.pdf", "application/pdf");
        assertEquals("Notes.pdf", download.fileName());
        assertTrue(download.resource().exists());
    }

    @Test
    void pathTraversalOnLoadIsBlocked() {
        assertThrows(ResourceNotFoundException.class, () -> storage.loadResource("../resumes/secret.pdf", "x.pdf", "application/pdf"));
    }

    @Test
    void deleteRemovesFile() throws Exception {
        String storedName = storage.storeResource(pdf("a.pdf"));
        storage.deleteResource(storedName);
        assertFalse(Files.exists(tempDir.resolve("resources").resolve(storedName)));
    }

    @Test
    void deleteWithTraversalIsRefused() {
        assertThrows(InvalidFileException.class, () -> storage.deleteResource("../../etc/passwd"));
    }

    @Test
    void checkedExceptionIsReallyChecked() {
        // FileStorageException extends Exception, so store() must declare it. This line proves the type.
        assertTrue(Exception.class.isAssignableFrom(FileStorageException.class));
        assertFalse(RuntimeException.class.isAssignableFrom(FileStorageException.class));
    }
}
