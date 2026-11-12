package com.fusionv.dto;

import java.time.LocalDateTime;

/** One comment. */
public record CommentResponse(
        Long id,
        Long postId,
        Long authorId,
        String authorName,
        String content,
        LocalDateTime createdAt
) {
}
