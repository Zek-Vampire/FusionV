package com.fusionv.dto;

/** Result of a hackathon import. */
public record ImportResult(
        int created,
        int skipped
) {
}
