package com.fusionv.config;

import com.fusionv.model.Role;
import com.fusionv.model.User;
import com.fusionv.repository.UserRepository;
import com.fusionv.util.ValidationUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/** At startup: creates the first administrator when ADMIN_EMAIL and ADMIN_PASSWORD are set. */
@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminEmail;
    private final String adminPassword;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder,
                           @Value("${fusionv.admin.email:}") String adminEmail,
                           @Value("${fusionv.admin.password:}") String adminPassword) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
    }

    @Override
    public void run(String... args) {
        if (adminEmail.isBlank() || adminPassword.isBlank()) {
            return;                                   // not configured: nothing to do
        }
        if (!ValidationUtil.isValidEmail(adminEmail) || !ValidationUtil.isStrongPassword(adminPassword)) {
            log.warn("ADMIN_EMAIL/ADMIN_PASSWORD are set but invalid (password: 8+ chars with a letter and a digit). Admin not created.");
            return;
        }
        String email = adminEmail.trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            return;
        }
        userRepository.save(new User("Administrator", email, passwordEncoder.encode(adminPassword), Role.ADMIN, LocalDateTime.now()));
        log.info("Administrator account created for {}", email);
    }
}
