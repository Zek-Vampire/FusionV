package com.fusionv.service;

import com.fusionv.TestData;
import com.fusionv.dto.ChangePasswordRequest;
import com.fusionv.dto.UpdateProfileRequest;
import com.fusionv.dto.UserResponse;
import com.fusionv.exception.BadRequestException;
import com.fusionv.exception.UserNotFoundException;
import com.fusionv.model.Skill;
import com.fusionv.model.User;
import com.fusionv.repository.PostRepository;
import com.fusionv.repository.StudyResourceRepository;
import com.fusionv.repository.TeamMemberRepository;
import com.fusionv.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class UserServiceTest {

    @Mock UserRepository userRepository;
    @Mock SkillService skillService;
    @Mock PasswordEncoder passwordEncoder;
    @Mock FileStorageService fileStorageService;
    @Mock TeamMemberRepository teamMemberRepository;
    @Mock StudyResourceRepository resourceRepository;
    @Mock PostRepository postRepository;
    UserService userService;
    User aryan;

    @BeforeEach
    void setUp() {
        userService = new UserService(userRepository, skillService, passwordEncoder, fileStorageService,
                teamMemberRepository, resourceRepository, postRepository);
        aryan = TestData.user(1L, "Aryan");
        when(userRepository.findById(1L)).thenReturn(Optional.of(aryan));
    }

    @Test
    void updateProfileChangesFields() {
        UserResponse response = userService.updateProfile(1L, new UpdateProfileRequest(
                "Aryan S", "2nd Year | Computer Engineering", "Fr. CRCE", "Keep building", "About me", "Mumbai", "https://example.com/me"));
        assertEquals("Aryan S", response.fullName());
        assertEquals("Mumbai", response.location());
        assertEquals("https://example.com/me", aryan.getLinkUrl());
    }

    @Test
    void updateProfileRejectsUnsafeLink() {
        assertThrows(BadRequestException.class, () -> userService.updateProfile(1L,
                new UpdateProfileRequest("Aryan", null, null, null, null, null, "javascript:alert(1)")));
    }

    @Test
    void blankFieldsBecomeNull() {
        userService.updateProfile(1L, new UpdateProfileRequest("Aryan", "  ", "", null, null, null, null));
        assertEquals(null, aryan.getYearBranch());
        assertEquals(null, aryan.getCollege());
    }

    @Test
    void changePasswordNeedsCorrectCurrentPassword() {
        when(passwordEncoder.matches("bad-current1", "hash")).thenReturn(false);
        assertThrows(BadRequestException.class,
                () -> userService.changePassword(1L, new ChangePasswordRequest("bad-current1", "newpass123")));
    }

    @Test
    void changePasswordStoresNewHash() {
        when(passwordEncoder.matches("old-pass123", "hash")).thenReturn(true);
        when(passwordEncoder.encode("newpass123")).thenReturn("NEWHASH");
        userService.changePassword(1L, new ChangePasswordRequest("old-pass123", "newpass123"));
        assertEquals("NEWHASH", aryan.getPasswordHash());
    }

    @Test
    void replaceSkillsUsesSkillService() {
        when(skillService.findOrCreateAll(any())).thenReturn(Set.of(new Skill("Java")));
        UserResponse response = userService.replaceSkills(1L, List.of("Java"));
        assertEquals(List.of("Java"), response.skills());
    }

    @Test
    void replaceInterestsRemovesDuplicates() {
        UserResponse response = userService.replaceInterests(1L, List.of("AI/ML", "ai/ml", "Open Source"));
        assertEquals(2, response.interests().size());
    }

    @Test
    void replaceInterestsRejectsStrangeCharacters() {
        assertThrows(BadRequestException.class, () -> userService.replaceInterests(1L, List.of("<script>")));
    }

    @Test
    void unknownUserGivesNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(UserNotFoundException.class, () -> userService.getMyProfile(99L));
    }

    @Test
    void exportContainsNameAndSkills() {
        aryan.getSkills().add(new Skill("Java"));
        String text = userService.exportProfileAsText(1L);
        assertTrue(text.contains("Aryan"));
        assertTrue(text.contains("1. Java"));
    }
}
