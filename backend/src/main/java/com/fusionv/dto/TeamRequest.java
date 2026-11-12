package com.fusionv.dto;

import jakarta.validation.constraints.*;
import java.util.List;

/** Create or update a team. */
public record TeamRequest(
        @NotBlank @Size(max = 100) String name,
        @Size(max = 1000) String description,
        Long hackathonId,
        @NotNull @Min(2) @Max(10) Integer maxMembers,
        @Size(max = 15) List<@NotBlank @Size(max = 50) String> skills
) {
}
