package com.fusionv.dto;

import jakarta.validation.constraints.*;
import com.fusionv.model.PostType;

import java.time.LocalDate;
import java.util.List;

/**
 * Create or edit a post. type is optional (default UPDATE).
 * The structured fields are optional and are only rendered for PROJECT / ACHIEVEMENT posts, so
 * updates and every post created before these fields existed keep working unchanged.
 */
public record PostRequest(
        @NotBlank @Size(max = 2000) String content,
        PostType type,
        @Size(max = 150) String title,
        @Size(max = 15, message = "A project can list at most 15 technologies")
        List<@NotBlank @Size(max = 50) String> technologies,
        @Size(max = 300) String repoUrl,
        @Size(max = 300) String projectUrl,
        @Size(max = 150) String organization,
        @Size(max = 300) String achievementUrl,
        LocalDate eventDate
) {

    /** Keeps the original API (content + type) convenient for older code and tests. */
    public PostRequest(String content, PostType type) {
        this(content, type, null, null, null, null, null, null, null);
    }
}
