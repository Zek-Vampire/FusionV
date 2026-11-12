package com.fusionv.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Public, short view of a student. It never contains the email, the resume or any account setting.
 * The richer fields let a public profile be useful while still exposing only profile data.
 */
public record StudentSummaryResponse(
        Long id,
        String fullName,
        String yearBranch,
        String college,
        String about,
        String location,
        String linkUrl,
        List<String> skills,
        List<String> interests,
        LocalDateTime createdAt
) {
}
