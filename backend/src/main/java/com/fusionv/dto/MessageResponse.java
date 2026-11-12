package com.fusionv.dto;

import java.time.LocalDateTime;

/** One team message. */
public record MessageResponse(
        Long id,
        Long teamId,
        Long senderId,
        String senderName,
        String content,
        LocalDateTime createdAt
) {
}
