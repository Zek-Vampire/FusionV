package com.fusionv.dto;

import jakarta.validation.constraints.*;

/** Body of POST /teams/{id}/invitations. */
public record InviteRequest(
        @NotBlank @Email String email
) {
}
