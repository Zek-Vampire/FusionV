package com.fusionv.dto;

import java.time.LocalDate;

/** Hackathon details. */
public record HackathonResponse(
        Long id,
        String name,
        String domain,
        String organizer,
        String location,
        String mode,
        String description,
        String eligibility,
        LocalDate startDate,
        LocalDate endDate,
        LocalDate registrationDeadline,
        Integer minTeamSize,
        Integer maxTeamSize,
        String registrationUrl
) {
}
