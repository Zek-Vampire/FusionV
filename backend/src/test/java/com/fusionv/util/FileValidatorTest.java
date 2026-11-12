package com.fusionv.util;

import com.fusionv.exception.InvalidFileException;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;

class FileValidatorTest {

    private static final long MAX = 1024 * 1024;
    private final byte[] pdfBytes = "%PDF-1.4 demo".getBytes(StandardCharsets.UTF_8);

    @Test
    void acceptsRealLookingPdf() {
        assertDoesNotThrow(() -> FileValidator.validate("notes.pdf", "application/pdf", pdfBytes, MAX, AppConstants.RESOURCE_EXTENSIONS));
    }

    @Test
    void rejectsEmptyFile() {
        assertThrows(InvalidFileException.class,
                () -> FileValidator.validate("notes.pdf", "application/pdf", new byte[0], MAX, AppConstants.RESOURCE_EXTENSIONS));
    }

    @Test
    void rejectsTooBigFile() {
        assertThrows(InvalidFileException.class,
                () -> FileValidator.validate("notes.pdf", "application/pdf", pdfBytes, 5, AppConstants.RESOURCE_EXTENSIONS));
    }

    @Test
    void rejectsDangerousExtension() {
        assertThrows(InvalidFileException.class,
                () -> FileValidator.validate("virus.exe", "application/octet-stream", pdfBytes, MAX, AppConstants.RESOURCE_EXTENSIONS));
    }

    @Test
    void rejectsWrongContentType() {
        assertThrows(InvalidFileException.class,
                () -> FileValidator.validate("notes.pdf", "text/html", pdfBytes, MAX, AppConstants.RESOURCE_EXTENSIONS));
    }

    @Test
    void rejectsFakePdfWhoseContentIsNotPdf() {
        byte[] fake = "<html>not a pdf</html>".getBytes(StandardCharsets.UTF_8);
        assertThrows(InvalidFileException.class,
                () -> FileValidator.validate("notes.pdf", "application/pdf", fake, MAX, AppConstants.RESOURCE_EXTENSIONS));
    }

    @Test
    void resumeAllowsOnlyDocumentTypes() {
        byte[] png = {(byte) 0x89, 0x50, 0x4E, 0x47, 1, 2};
        assertThrows(InvalidFileException.class,
                () -> FileValidator.validate("me.png", "image/png", png, MAX, AppConstants.RESUME_EXTENSIONS));
    }

    @Test
    void cleanFileNameRemovesFoldersAndOddCharacters() {
        assertEquals("passwd", FileValidator.cleanFileName("../../etc/passwd"));
        assertEquals("my_notes__1_.pdf", FileValidator.cleanFileName("my notes (1).pdf"));
        assertEquals("file", FileValidator.cleanFileName("   "));
    }

    @Test
    void extensionIsLowerCase() {
        assertEquals("pdf", FileValidator.getExtension("Notes.PDF"));
        assertEquals("", FileValidator.getExtension("noextension"));
        assertFalse(FileValidator.getExtension("archive.tar.gz").isEmpty());
    }
}
