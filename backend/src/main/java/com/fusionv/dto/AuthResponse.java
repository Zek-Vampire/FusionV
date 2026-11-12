package com.fusionv.dto;

/** Returned after login/registration: the JWT and the user. */
public record AuthResponse(
        String token,
        UserResponse user
) {
}
