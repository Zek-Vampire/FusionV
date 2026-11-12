package com.fusionv.service;

import com.fusionv.dto.ChangePasswordRequest;
import com.fusionv.dto.FileDownload;
import com.fusionv.dto.ProfileStatsResponse;
import com.fusionv.dto.StudentSummaryResponse;
import com.fusionv.dto.UpdateProfileRequest;
import com.fusionv.dto.UserResponse;
import com.fusionv.exception.BadRequestException;
import com.fusionv.exception.FileStorageException;
import com.fusionv.exception.ResourceNotFoundException;
import com.fusionv.exception.UserNotFoundException;
import com.fusionv.model.User;
import com.fusionv.repository.PostRepository;
import com.fusionv.repository.StudentSpecs;
import com.fusionv.repository.StudyResourceRepository;
import com.fusionv.repository.TeamMemberRepository;
import com.fusionv.repository.UserRepository;
import com.fusionv.util.ProfileExportBuilder;
import com.fusionv.util.ValidationUtil;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

/** Profiles, skills, interests, student search, resume. */
@Service
public class UserService {

    private final UserRepository userRepository;
    private final SkillService skillService;
    private final PasswordEncoder passwordEncoder;
    private final FileStorageService fileStorageService;
    private final TeamMemberRepository teamMemberRepository;
    private final StudyResourceRepository resourceRepository;
    private final PostRepository postRepository;

    public UserService(UserRepository userRepository, SkillService skillService, PasswordEncoder passwordEncoder,
                       FileStorageService fileStorageService, TeamMemberRepository teamMemberRepository,
                       StudyResourceRepository resourceRepository, PostRepository postRepository) {
        this.userRepository = userRepository;
        this.skillService = skillService;
        this.passwordEncoder = passwordEncoder;
        this.fileStorageService = fileStorageService;
        this.teamMemberRepository = teamMemberRepository;
        this.resourceRepository = resourceRepository;
        this.postRepository = postRepository;
    }

    @Transactional(readOnly = true)
    public UserResponse getMyProfile(Long userId) {
        return DtoMapper.toUserResponse(loadUser(userId));
    }

    @Transactional(readOnly = true)
    public StudentSummaryResponse getPublicProfile(Long userId) {
        return DtoMapper.toStudentSummary(loadUser(userId));
    }

    @Transactional
    public UserResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = loadUser(userId);
        String link = clean(request.linkUrl());
        if (link != null && !ValidationUtil.isValidUrl(link)) {
            throw new BadRequestException("The link must start with http:// or https://");
        }
        user.setFullName(request.fullName().trim());
        user.setYearBranch(clean(request.yearBranch()));
        user.setCollege(clean(request.college()));
        user.setMotto(clean(request.motto()));
        user.setAbout(clean(request.about()));
        user.setLocation(clean(request.location()));
        user.setLinkUrl(link);
        return DtoMapper.toUserResponse(user);
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = loadUser(userId);
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect");
        }
        if (!ValidationUtil.isStrongPassword(request.newPassword())) {
            throw new BadRequestException("New password must have at least 8 characters, with a letter and a digit");
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
    }

    @Transactional
    public UserResponse replaceSkills(Long userId, List<String> names) {
        User user = loadUser(userId);
        user.setSkills(skillService.findOrCreateAll(names));
        return DtoMapper.toUserResponse(user);
    }

    @Transactional
    public UserResponse replaceInterests(Long userId, List<String> names) {
        User user = loadUser(userId);
        List<String> cleaned = ValidationUtil.cleanNames(names);
        for (String interest : cleaned) {
            if (!ValidationUtil.isValidSkillName(interest)) {
                throw new BadRequestException("Invalid interest '" + interest + "'");
            }
        }
        user.getInterests().clear();
        user.getInterests().addAll(cleaned);
        return DtoMapper.toUserResponse(user);
    }

    /** "Find students with a skill": at most 50 results, sorted by name. */
    @Transactional(readOnly = true)
    public List<StudentSummaryResponse> searchStudents(String nameText, String skill) {
        List<User> found = userRepository
                .findAll(StudentSpecs.filter(nameText, skill), PageRequest.of(0, 50, Sort.by("fullName")))
                .getContent();
        List<StudentSummaryResponse> result = new ArrayList<>();
        for (User user : found) {
            result.add(DtoMapper.toStudentSummary(user));
        }
        return result;
    }

    @Transactional(readOnly = true)
    public ProfileStatsResponse getStats(Long userId) {
        return new ProfileStatsResponse(
                teamMemberRepository.countByUserId(userId),
                teamMemberRepository.countHackathonsOfUser(userId),
                resourceRepository.countByUploaderId(userId),
                postRepository.countByAuthorId(userId));
    }

    /** A printable text version of the profile (built with StringBuilder inside ProfileExportBuilder). */
    @Transactional(readOnly = true)
    public String exportProfileAsText(Long userId) {
        UserResponse profile = DtoMapper.toUserResponse(loadUser(userId));
        return new ProfileExportBuilder()
                .addTitle("FusionV profile: " + profile.fullName())
                .addLine("Email", profile.email())
                .addLine("Year/Branch", profile.yearBranch())
                .addLine("College", profile.college())
                .addLine("Location", profile.location())
                .addLine("Link", profile.linkUrl())
                .addLine("About", profile.about())
                .addList("Skills", profile.skills())
                .addList("Interests", profile.interests())
                .build();
    }

    @Transactional(rollbackFor = FileStorageException.class)
    public UserResponse uploadResume(Long userId, MultipartFile file) throws FileStorageException {
        User user = loadUser(userId);
        String oldStoredName = user.getResumeStoredName();
        String newStoredName = fileStorageService.storeResume(file);
        user.setResumeFileName(com.fusionv.util.FileValidator.cleanFileName(file.getOriginalFilename()));
        user.setResumeStoredName(newStoredName);
        userRepository.saveAndFlush(user);
        fileStorageService.deleteResumeQuietly(oldStoredName);
        return DtoMapper.toUserResponse(user);
    }

    @Transactional(readOnly = true)
    public FileDownload downloadResume(Long userId) {
        User user = loadUser(userId);
        if (user.getResumeStoredName() == null) {
            throw new ResourceNotFoundException("You have not uploaded a resume yet");
        }
        return fileStorageService.loadResume(user.getResumeStoredName(), user.getResumeFileName());
    }

    // ---------------------------------------------------------------- helpers

    private User loadUser(Long userId) {
        return userRepository.findById(userId).orElseThrow(() -> new UserNotFoundException(userId));
    }

    /** Trims text and turns blank text into null. */
    private String clean(String text) {
        if (text == null || text.isBlank()) {
            return null;
        }
        return text.trim();
    }
}
