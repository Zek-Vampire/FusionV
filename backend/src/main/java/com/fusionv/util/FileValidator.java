package com.fusionv.util;

import com.fusionv.exception.InvalidFileException;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Checks an uploaded file BEFORE it is saved: name, size, extension, content type and the
 * first bytes of the file ("magic bytes"). It only throws InvalidFileException (unchecked).
 */
public final class FileValidator {

    /** Module 4: Map from extension to the content types a browser may send for it. */
    private static final Map<String, List<String>> CONTENT_TYPES = new HashMap<>();

    static {
        CONTENT_TYPES.put("pdf", List.of("application/pdf"));
        CONTENT_TYPES.put("doc", List.of("application/msword", "application/octet-stream"));
        CONTENT_TYPES.put("docx", List.of(
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/octet-stream"));
        CONTENT_TYPES.put("ppt", List.of("application/vnd.ms-powerpoint", "application/octet-stream"));
        CONTENT_TYPES.put("pptx", List.of(
                "application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/octet-stream"));
        CONTENT_TYPES.put("txt", List.of("text/plain"));
        CONTENT_TYPES.put("png", List.of("image/png"));
        CONTENT_TYPES.put("jpg", List.of("image/jpeg"));
        CONTENT_TYPES.put("jpeg", List.of("image/jpeg"));
    }

    private FileValidator() {
    }

    /** Returns the lower-case extension ("Notes.PDF" gives "pdf") or "" when there is none. */
    public static String getExtension(String fileName) {
        if (fileName == null) {
            return "";
        }
        int dot = fileName.lastIndexOf('.');
        if (dot < 0 || dot == fileName.length() - 1) {
            return "";
        }
        return fileName.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    /**
     * Removes folders and strange characters from the name the user sent.
     * "../../etc/passwd" becomes "passwd"; "my notes (1).pdf" becomes "my_notes__1_.pdf".
     */
    public static String cleanFileName(String originalName) {
        if (originalName == null || originalName.isBlank()) {
            return "file";
        }
        String name = originalName.replace('\\', '/');
        name = name.substring(name.lastIndexOf('/') + 1);
        name = name.replaceAll("[^A-Za-z0-9._-]", "_");
        if (name.length() > 100) {
            name = name.substring(name.length() - 100);
        }
        return name.isEmpty() ? "file" : name;
    }

    /**
     * Full validation. Throws InvalidFileException with a readable message when something is wrong.
     *
     * @param allowedExtensions array of allowed extensions, e.g. AppConstants.RESOURCE_EXTENSIONS
     */
    public static void validate(String originalName, String contentType, byte[] data,
                                long maxSizeBytes, String[] allowedExtensions) {
        if (data == null || data.length == 0) {
            throw new InvalidFileException("The uploaded file is empty");
        }
        if (data.length > maxSizeBytes) {
            throw new InvalidFileException("File is too large (maximum " + (maxSizeBytes / (1024 * 1024)) + " MB)");
        }
        String extension = getExtension(originalName);
        if (!Arrays.asList(allowedExtensions).contains(extension)) {
            throw new InvalidFileException("File type '." + extension + "' is not allowed. Allowed: "
                    + String.join(", ", allowedExtensions));
        }
        String type = contentType == null ? "" : contentType.toLowerCase(Locale.ROOT);
        List<String> expectedTypes = CONTENT_TYPES.get(extension);
        if (expectedTypes == null || !expectedTypes.contains(type)) {
            throw new InvalidFileException("Content type '" + type + "' does not match the file extension");
        }
        if (!startsLikeExpected(extension, data)) {
            throw new InvalidFileException("File content does not look like a real ." + extension + " file");
        }
    }

    /** Compares the first bytes of the file with the known signature of its type. */
    static boolean startsLikeExpected(String extension, byte[] data) {
        switch (extension) {
            case "pdf":
                return startsWith(data, new int[]{0x25, 0x50, 0x44, 0x46});              // %PDF
            case "png":
                return startsWith(data, new int[]{0x89, 0x50, 0x4E, 0x47});              // .PNG
            case "jpg":
            case "jpeg":
                return startsWith(data, new int[]{0xFF, 0xD8, 0xFF});
            case "docx":
            case "pptx":
                return startsWith(data, new int[]{0x50, 0x4B});                          // "PK" = zip container
            case "doc":
            case "ppt":
                return startsWith(data, new int[]{0xD0, 0xCF, 0x11, 0xE0});              // old Office format
            default:
                return true;                                                              // txt has no signature
        }
    }

    private static boolean startsWith(byte[] data, int[] signature) {
        if (data.length < signature.length) {
            return false;
        }
        for (int i = 0; i < signature.length; i++) {
            if ((data[i] & 0xFF) != signature[i]) {
                return false;
            }
        }
        return true;
    }
}
