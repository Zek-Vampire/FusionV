package com.fusionv.dto;

import jakarta.validation.constraints.*;
import java.util.List;

/** List of skill or interest names. */
public record NameListRequest(
        @NotNull @Size(max = 30) List<@NotBlank @Size(max = 50) String> values
) {
}
