package com.fusionv.dto;

import java.util.List;
import java.time.LocalDateTime;

/** Profile returned to the logged-in user. It never contains the password hash. */
public record UserResponse(
        Long id,
        String fullName,
        String email,
        String role,
        String yearBranch,
        String college,
        String motto,
        String about,
        String location,
        String linkUrl,
        String resumeFileName,
        List<String> skills,
        List<String> interests,
        LocalDateTime createdAt
) {
}
