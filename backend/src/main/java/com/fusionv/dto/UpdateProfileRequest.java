package com.fusionv.dto;

import jakarta.validation.constraints.*;

/** Body of PUT /users/me. */
public record UpdateProfileRequest(
        @NotBlank @Size(min = 2, max = 100) String fullName,
        @Size(max = 100) String yearBranch,
        @Size(max = 150) String college,
        @Size(max = 200) String motto,
        @Size(max = 2000) String about,
        @Size(max = 100) String location,
        @Size(max = 300) String linkUrl
) {
}
