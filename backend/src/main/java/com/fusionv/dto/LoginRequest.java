package com.fusionv.dto;

import jakarta.validation.constraints.*;

/** Body of POST /auth/login. */
public record LoginRequest(
        @NotBlank @Email String email,
        @NotBlank String password
) {
}
