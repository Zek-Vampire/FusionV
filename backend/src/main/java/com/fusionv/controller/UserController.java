package com.fusionv.controller;

import com.fusionv.dto.ChangePasswordRequest;
import com.fusionv.dto.NameListRequest;
import com.fusionv.dto.ProfileStatsResponse;
import com.fusionv.dto.StudentSummaryResponse;
import com.fusionv.dto.UpdateProfileRequest;
import com.fusionv.dto.UserResponse;
import com.fusionv.exception.FileStorageException;
import com.fusionv.security.UserPrincipal;
import com.fusionv.service.UserService;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public UserResponse getMe(@AuthenticationPrincipal UserPrincipal me) {
        return userService.getMyProfile(me.getId());
    }

    @PutMapping("/me")
    public UserResponse updateMe(@AuthenticationPrincipal UserPrincipal me, @Valid @RequestBody UpdateProfileRequest request) {
        return userService.updateProfile(me.getId(), request);
    }

    @PostMapping("/me/password")
    public ResponseEntity<Void> changePassword(@AuthenticationPrincipal UserPrincipal me,
                                               @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(me.getId(), request);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/me/skills")
    public UserResponse setSkills(@AuthenticationPrincipal UserPrincipal me, @Valid @RequestBody NameListRequest request) {
        return userService.replaceSkills(me.getId(), request.values());
    }

    @PutMapping("/me/interests")
    public UserResponse setInterests(@AuthenticationPrincipal UserPrincipal me, @Valid @RequestBody NameListRequest request) {
        return userService.replaceInterests(me.getId(), request.values());
    }

    @GetMapping("/me/stats")
    public ProfileStatsResponse getStats(@AuthenticationPrincipal UserPrincipal me) {
        return userService.getStats(me.getId());
    }

    @GetMapping(value = "/me/export", produces = MediaType.TEXT_PLAIN_VALUE)
    public String exportProfile(@AuthenticationPrincipal UserPrincipal me) {
        return userService.exportProfileAsText(me.getId());
    }

    @PostMapping(value = "/me/resume", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UserResponse uploadResume(@AuthenticationPrincipal UserPrincipal me,
                                     @RequestParam("file") MultipartFile file) throws FileStorageException {
        return userService.uploadResume(me.getId(), file);
    }

    @GetMapping("/me/resume")
    public ResponseEntity<Resource> downloadResume(@AuthenticationPrincipal UserPrincipal me) {
        return DownloadResponses.asAttachment(userService.downloadResume(me.getId()));
    }

    /** Find students by name and/or skill, e.g. GET /api/v1/users/search?skill=Java */
    @GetMapping("/search")
    public List<StudentSummaryResponse> search(@RequestParam(required = false) String q,
                                               @RequestParam(required = false) String skill) {
        return userService.searchStudents(q, skill);
    }

    @GetMapping("/{id}")
    public StudentSummaryResponse getStudent(@PathVariable Long id) {
        return userService.getPublicProfile(id);
    }
}
