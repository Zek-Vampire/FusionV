package com.fusionv.dto;

import jakarta.validation.constraints.*;

/** Body of POST /posts/{id}/comments. */
public record CommentRequest(
        @NotBlank @Size(max = 1000) String content
) {
}
