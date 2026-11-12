package com.fusionv.dto;

import jakarta.validation.constraints.*;

/** Body of POST /users/me/password. */
public record ChangePasswordRequest(
        @NotBlank String currentPassword,
        @NotBlank @Size(min = 8, max = 100) String newPassword
) {
}
