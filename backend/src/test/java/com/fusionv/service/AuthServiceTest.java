package com.fusionv.service;

import com.fusionv.dto.AuthResponse;
import com.fusionv.dto.LoginRequest;
import com.fusionv.dto.RegisterRequest;
import com.fusionv.exception.BadRequestException;
import com.fusionv.exception.DuplicateEntryException;
import com.fusionv.exception.InvalidCredentialsException;
import com.fusionv.model.Role;
import com.fusionv.model.User;
import com.fusionv.repository.UserRepository;
import com.fusionv.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AuthServiceTest {

    @Mock UserRepository userRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtService jwtService;
    AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, passwordEncoder, jwtService);
        when(passwordEncoder.encode(any())).thenReturn("HASHED");
        when(jwtService.generateToken(any())).thenReturn("token-123");
        when(userRepository.save(any(User.class))).thenAnswer(call -> call.getArgument(0));
    }

    @Test
    void registerStoresHashedPasswordAndLowerCaseEmail() {
        AuthResponse response = authService.register(new RegisterRequest("Aryan Sharma", "Aryan@Example.com", "hello1234"));

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        assertEquals("HASHED", saved.getValue().getPasswordHash());       // never the plain password
        assertEquals("aryan@example.com", saved.getValue().getEmail());
        assertEquals(Role.STUDENT, saved.getValue().getRole());
        assertEquals("token-123", response.token());
    }

    @Test
    void registerRejectsWeakPassword() {
        assertThrows(BadRequestException.class,
                () -> authService.register(new RegisterRequest("Aryan", "aryan@example.com", "abcdefgh")));
        verify(userRepository, never()).save(any());
    }

    @Test
    void registerRejectsDuplicateEmail() {
        when(userRepository.existsByEmailIgnoreCase("aryan@example.com")).thenReturn(true);
        assertThrows(DuplicateEntryException.class,
                () -> authService.register(new RegisterRequest("Aryan", "aryan@example.com", "hello1234")));
    }

    @Test
    void loginWithWrongPasswordFails() {
        User user = new User("Aryan", "aryan@example.com", "HASHED", Role.STUDENT, LocalDateTime.now());
        when(userRepository.findByEmailIgnoreCase("aryan@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong-pass1", "HASHED")).thenReturn(false);
        assertThrows(InvalidCredentialsException.class, () -> authService.login(new LoginRequest("aryan@example.com", "wrong-pass1")));
    }

    @Test
    void loginWithUnknownEmailGivesSameError() {
        when(userRepository.findByEmailIgnoreCase("nobody@example.com")).thenReturn(Optional.empty());
        assertThrows(InvalidCredentialsException.class, () -> authService.login(new LoginRequest("nobody@example.com", "whatever1")));
    }

    @Test
    void loginSucceedsWithCorrectPassword() {
        User user = new User("Aryan", "aryan@example.com", "HASHED", Role.STUDENT, LocalDateTime.now());
        when(userRepository.findByEmailIgnoreCase("aryan@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("hello1234", "HASHED")).thenReturn(true);
        assertEquals("token-123", authService.login(new LoginRequest("aryan@example.com", "hello1234")).token());
    }
}
