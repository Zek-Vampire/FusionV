package com.fusionv.dto;

/** Aggregate numbers that are safe to show to every visitor (no user details). */
public record PublicStatsResponse(
        long students,
        long teams,
        long hackathons,
        long resources,
        long posts
) {
}
