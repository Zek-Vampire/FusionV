package com.fusionv.dto;

import java.time.LocalDateTime;

/** A join request or an invitation. */
public record JoinRequestResponse(
        Long id,
        Long teamId,
        String teamName,
        Long userId,
        String userName,
        String type,
        String status,
        LocalDateTime createdAt
) {
}
