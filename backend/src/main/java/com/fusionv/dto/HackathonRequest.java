package com.fusionv.dto;

import jakarta.validation.constraints.*;
import com.fusionv.model.HackathonMode;
import java.time.LocalDate;

/** Create/update/import a hackathon (administrators only). */
public record HackathonRequest(
        @NotBlank @Size(max = 200) String name,
        @Size(max = 100) String domain,
        @Size(max = 150) String organizer,
        @Size(max = 150) String location,
        @NotNull HackathonMode mode,
        @Size(max = 2000) String description,
        @Size(max = 500) String eligibility,
        LocalDate startDate,
        LocalDate endDate,
        LocalDate registrationDeadline,
        @Min(1) @Max(20) Integer minTeamSize,
        @Min(1) @Max(20) Integer maxTeamSize,
        @Size(max = 500) String registrationUrl
) {
}
