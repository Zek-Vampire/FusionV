package com.fusionv.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/** A post with counters and optional structured project/achievement metadata. */
public record PostResponse(
        Long id,
        Long authorId,
        String authorName,
        String content,
        String type,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        long likeCount,
        long commentCount,
        boolean likedByMe,
        String title,
        List<String> technologies,
        String repoUrl,
        String projectUrl,
        String organization,
        String achievementUrl,
        LocalDate eventDate
) {
}
