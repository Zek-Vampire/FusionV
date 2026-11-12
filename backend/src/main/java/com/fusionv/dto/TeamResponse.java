package com.fusionv.dto;

import java.util.List;
import java.time.LocalDateTime;

/** Team details. myStatus is LEADER, MEMBER, REQUESTED, INVITED or NONE (relative to the caller). */
public record TeamResponse(
        Long id,
        String name,
        String description,
        Long hackathonId,
        String hackathonName,
        Long leaderId,
        String leaderName,
        int maxMembers,
        int memberCount,
        List<String> skills,
        List<MemberResponse> members,
        String myStatus,
        long pendingRequests,
        LocalDateTime createdAt
) {
}
