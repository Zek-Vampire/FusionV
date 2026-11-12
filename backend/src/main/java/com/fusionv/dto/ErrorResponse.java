package com.fusionv.dto;

import java.util.Map;
import java.time.LocalDateTime;

/** Every error of the API has this shape. */
public record ErrorResponse(
        LocalDateTime timestamp,
        int status,
        String error,
        String message,
        Map<String, String> fieldErrors
) {
}
