package com.fusionv.dto;

import jakarta.validation.constraints.*;

/** Body of POST /auth/register. */
public record RegisterRequest(
        @NotBlank @Size(min = 2, max = 100) String fullName,
        @NotBlank @Email @Size(max = 150) String email,
        @NotBlank @Size(min = 8, max = 100) String password
) {
}
