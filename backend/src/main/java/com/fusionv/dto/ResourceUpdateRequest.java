package com.fusionv.dto;

import jakarta.validation.constraints.*;
import com.fusionv.model.ResourceCategory;

/** Body of PUT /resources/{id}. */
public record ResourceUpdateRequest(
        @NotBlank @Size(max = 150) String title,
        @Size(max = 1000) String description,
        @Size(max = 100) String subject,
        @NotNull ResourceCategory category,
        @Size(max = 200) String tags
) {
}
