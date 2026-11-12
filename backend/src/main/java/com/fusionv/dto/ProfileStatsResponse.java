package com.fusionv.dto;

/** Numbers shown on the profile page. */
public record ProfileStatsResponse(
        long teamsJoined,
        long hackathons,
        long resourcesShared,
        long posts
) {
}
