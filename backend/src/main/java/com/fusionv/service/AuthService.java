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
import com.fusionv.util.ValidationUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/** Registration and login. Passwords are hashed with BCrypt and never returned or logged. */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (!ValidationUtil.isValidEmail(email)) {
            throw new BadRequestException("Please enter a valid email address");
        }
        if (!ValidationUtil.isStrongPassword(request.password())) {
            throw new BadRequestException("Password must have at least 8 characters, with a letter and a digit");
        }
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new DuplicateEntryException("An account with this email already exists");
        }
        User user = new User(request.fullName().trim(), email, passwordEncoder.encode(request.password()),
                Role.STUDENT, LocalDateTime.now());
        userRepository.save(user);
        return new AuthResponse(jwtService.generateToken(user), DtoMapper.toUserResponse(user));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.email().trim())
                .orElseThrow(InvalidCredentialsException::new);
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();      // same message as "unknown email"
        }
        return new AuthResponse(jwtService.generateToken(user), DtoMapper.toUserResponse(user));
    }
}
