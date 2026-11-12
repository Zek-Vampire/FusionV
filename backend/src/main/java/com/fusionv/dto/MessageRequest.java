package com.fusionv.dto;

import jakarta.validation.constraints.*;

/** Body of POST /teams/{id}/messages. */
public record MessageRequest(
        @NotBlank @Size(max = 1000) String content
) {
}
