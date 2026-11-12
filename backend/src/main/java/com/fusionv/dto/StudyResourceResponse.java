package com.fusionv.dto;

import java.time.LocalDateTime;

/** Metadata of a study material. */
public record StudyResourceResponse(
        Long id,
        String title,
        String description,
        String subject,
        String category,
        String tags,
        String originalFileName,
        String contentType,
        long sizeBytes,
        int downloadCount,
        Long uploaderId,
        String uploaderName,
        LocalDateTime createdAt,
        String downloadUrl
) {
}
