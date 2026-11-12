package com.fusionv.service;

import com.fusionv.TestData;
import com.fusionv.model.Role;
import com.fusionv.model.User;
import com.fusionv.security.JwtService;
import com.fusionv.security.UserPrincipal;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtServiceTest {

    private static final String SECRET = "unit-test-secret-that-is-at-least-32-chars-long";

    @Test
    void tokenRoundTripKeepsIdEmailAndRole() {
        JwtService jwt = new JwtService(SECRET, 60);
        User user = TestData.user(7L, "Aryan");
        user.setRole(Role.ADMIN);
        UserPrincipal principal = jwt.parseToken(jwt.generateToken(user));
        assertEquals(7L, principal.getId());
        assertEquals("aryan@example.com", principal.getEmail());
        assertTrue(principal.isAdmin());
    }

    @Test
    void shortSecretIsRefused() {
        assertThrows(IllegalStateException.class, () -> new JwtService("too-short", 60));
    }

    @Test
    void tamperedTokenIsRejected() {
        JwtService jwt = new JwtService(SECRET, 60);
        String token = jwt.generateToken(TestData.user(1L, "Aryan"));
        assertThrows(JwtException.class, () -> jwt.parseToken(token.substring(0, token.length() - 3) + "abc"));
    }

    @Test
    void tokenSignedWithAnotherSecretIsRejected() {
        String token = new JwtService("another-secret-that-is-also-32-chars-long!!", 60).generateToken(TestData.user(1L, "Aryan"));
        assertThrows(JwtException.class, () -> new JwtService(SECRET, 60).parseToken(token));
    }

    @Test
    void expiredTokenIsRejected() {
        JwtService jwt = new JwtService(SECRET, -1);
        String token = jwt.generateToken(TestData.user(1L, "Aryan"));
        assertThrows(JwtException.class, () -> jwt.parseToken(token));
    }
}
