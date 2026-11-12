package com.fusionv.dto;

import java.time.LocalDateTime;

/** One member of a team. */
public record MemberResponse(
        Long userId,
        String fullName,
        String role,
        LocalDateTime joinedAt
) {
}
