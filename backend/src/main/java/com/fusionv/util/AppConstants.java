package com.fusionv.util;

/**
 * Module 3: a "final" class cannot be extended, and "final" fields are constants.
 * Module 4: the arrays below are plain Java arrays.
 */
public final class AppConstants {

    public static final String API_PREFIX = "/api/v1";
    public static final int MIN_TEAM_SIZE = 2;
    public static final int MAX_TEAM_SIZE = 10;
    public static final int MIN_PASSWORD_LENGTH = 8;

    /** File extensions allowed for study materials (Module 4: array). */
    public static final String[] RESOURCE_EXTENSIONS = {"pdf", "doc", "docx", "ppt", "pptx", "txt", "png", "jpg", "jpeg"};

    /** File extensions allowed for resumes (Module 4: array). */
    public static final String[] RESUME_EXTENSIONS = {"pdf", "doc", "docx"};

    private AppConstants() {
        // utility class: nobody should create an object of it
    }
}
