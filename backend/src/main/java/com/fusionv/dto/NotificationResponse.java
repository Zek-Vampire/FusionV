package com.fusionv.dto;

import java.time.LocalDateTime;

/** One notification. */
public record NotificationResponse(
        Long id,
        String type,
        String message,
        Long relatedTeamId,
        boolean read,
        LocalDateTime createdAt
) {
}
